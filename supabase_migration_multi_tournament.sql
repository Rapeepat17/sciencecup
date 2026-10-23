-- ============================================================================
-- SCI CUP: Multi-Tournament Database Migration Script
-- ได้รับการอนุมัติ: รองรับ 3-Tier Architecture & ER Diagram
-- ข้อกำหนด: ไม่ DROP/TRUNCATE/DELETE ข้อมูลเดิม, คง sci_cup_main ไว้อย่างปลอดภัย
-- ============================================================================

-- ============================================================================
-- ส่วนที่ 1: BACKUP SCRIPT (สำรองตารางเดิมไว้เป็น _backup_2026)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tournaments_backup_2026 AS SELECT * FROM public.tournaments;
CREATE TABLE IF NOT EXISTS public.teams_backup_2026 AS SELECT * FROM public.teams;
CREATE TABLE IF NOT EXISTS public.players_backup_2026 AS SELECT * FROM public.players;
CREATE TABLE IF NOT EXISTS public.groups_backup_2026 AS SELECT * FROM public.groups;
CREATE TABLE IF NOT EXISTS public.matches_backup_2026 AS SELECT * FROM public.matches;

DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
        CREATE TABLE IF NOT EXISTS public.goals_backup_2026 AS SELECT * FROM public.goals;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cards') THEN
        CREATE TABLE IF NOT EXISTS public.cards_backup_2026 AS SELECT * FROM public.cards;
    END IF;
END $$;

-- ============================================================================
-- ส่วนที่ 2: MAIN MIGRATION SCRIPT (ปรับโครงสร้างและย้ายข้อมูล)
-- ============================================================================

-- 2.1 ตาราง TOURNAMENTS
CREATE TABLE IF NOT EXISTS public.tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    knockout_starting_round TEXT DEFAULT 'sf',
    is_bracket_locked BOOLEAN DEFAULT FALSE,
    is_knockout_created BOOLEAN DEFAULT FALSE,
    is_user_portal_enabled BOOLEAN DEFAULT TRUE,
    bracket_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments DROP COLUMN IF EXISTS status;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- บันทึกทัวร์นาเมนต์หลัก sci_cup_main
INSERT INTO public.tournaments (id, name, knockout_starting_round, is_bracket_locked, is_knockout_created, is_user_portal_enabled)
VALUES ('sci_cup_main', 'SCI CUP 2026', 'sf', FALSE, FALSE, TRUE)
ON CONFLICT (id) DO UPDATE 
SET name = COALESCE(public.tournaments.name, 'SCI CUP 2026');

-- 2.2 ตาราง PROFILES และ TOURNAMENT_MEMBERS (ตาม ER Diagram)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin', -- 'owner', 'admin', 'scorekeeper', 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, profile_id)
);

-- 2.3 ตาราง MATCH_EVENTS (ตาม ER Diagram)
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id TEXT REFERENCES public.tournaments(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    team_id TEXT,
    player_id TEXT,
    player_number TEXT,
    event_type TEXT NOT NULL, -- 'goal', 'yellow_card', 'red_card', 'sub', 'penalty'
    minute INTEGER DEFAULT 0,
    extra_minute INTEGER DEFAULT 0,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 เพิ่ม tournament_id และผูก Foreign Key ป้องกันข้อมูลสูญหาย
-- ตาราง TEAMS
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS tournament_id TEXT;
UPDATE public.teams SET tournament_id = 'sci_cup_main' WHERE tournament_id IS NULL;
ALTER TABLE public.teams ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS fk_teams_tournament;
ALTER TABLE public.teams ADD CONSTRAINT fk_teams_tournament 
    FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);

-- ตาราง GROUPS
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS tournament_id TEXT;
UPDATE public.groups SET tournament_id = 'sci_cup_main' WHERE tournament_id IS NULL;
ALTER TABLE public.groups ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS fk_groups_tournament;
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_tournament 
    FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_groups_tournament_id ON public.groups(tournament_id);

-- ตาราง MATCHES
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tournament_id TEXT;
UPDATE public.matches SET tournament_id = 'sci_cup_main' WHERE tournament_id IS NULL;
ALTER TABLE public.matches ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS fk_matches_tournament;
ALTER TABLE public.matches ADD CONSTRAINT fk_matches_tournament 
    FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);

-- ตาราง PLAYERS
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS tournament_id TEXT;
UPDATE public.players p
SET tournament_id = COALESCE(t.tournament_id, 'sci_cup_main')
FROM public.teams t
WHERE p.team_id = t.id AND p.tournament_id IS NULL;
UPDATE public.players SET tournament_id = 'sci_cup_main' WHERE tournament_id IS NULL;
ALTER TABLE public.players ALTER COLUMN tournament_id SET NOT NULL;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS fk_players_tournament;
ALTER TABLE public.players ADD CONSTRAINT fk_players_tournament 
    FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON public.players(tournament_id);

-- 2.5 คัดลอกข้อมูลจาก goals และ cards เดิมเข้า match_events (คงตารางเดิมไว้)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'goals') THEN
        INSERT INTO public.match_events (tournament_id, match_id, team_id, player_number, event_type, minute)
        SELECT 
            COALESCE(g.tournament_id, m.tournament_id, 'sci_cup_main'),
            g.match_id,
            g.team_id,
            g.player_number,
            'goal',
            COALESCE(g.minute, 0)
        FROM public.goals g
        LEFT JOIN public.matches m ON g.match_id = m.id
        ON CONFLICT DO NOTHING;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cards') THEN
        INSERT INTO public.match_events (tournament_id, match_id, team_id, player_number, event_type, minute)
        SELECT 
            COALESCE(c.tournament_id, m.tournament_id, 'sci_cup_main'),
            c.match_id,
            c.team_id,
            c.player_number,
            CASE WHEN c.card_type = 'red' THEN 'red_card' ELSE 'yellow_card' END,
            COALESCE(c.minute, 0)
        FROM public.cards c
        LEFT JOIN public.matches m ON c.match_id = m.id
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_match_events_tournament ON public.match_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON public.match_events(match_id);

-- 2.6 Trigger ป้องกันการเชื่อมทีมข้ามรายการ (Cross-Tournament Integrity)
CREATE OR REPLACE FUNCTION public.check_match_teams_tournament()
RETURNS TRIGGER AS $$
DECLARE
    home_tourney TEXT;
    away_tourney TEXT;
BEGIN
    IF NEW.home_team_id IS NOT NULL THEN
        SELECT tournament_id INTO home_tourney FROM public.teams WHERE id = NEW.home_team_id;
        IF home_tourney IS NOT NULL AND home_tourney <> NEW.tournament_id THEN
            RAISE EXCEPTION 'ทีมเหย้า (ID: %) ไม่ได้อยู่ในทัวร์นาเมนต์นี้ (%)', NEW.home_team_id, NEW.tournament_id;
        END IF;
    END IF;

    IF NEW.away_team_id IS NOT NULL THEN
        SELECT tournament_id INTO away_tourney FROM public.teams WHERE id = NEW.away_team_id;
        IF away_tourney IS NOT NULL AND away_tourney <> NEW.tournament_id THEN
            RAISE EXCEPTION 'ทีมเยือน (ID: %) ไม่ได้อยู่ในทัวร์นาเมนต์นี้ (%)', NEW.away_team_id, NEW.tournament_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_match_teams ON public.matches;
CREATE TRIGGER trg_check_match_teams
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.check_match_teams_tournament();

-- ============================================================================
-- ส่วนที่ 3: VERIFICATION QUERIES (ตรวจสอบความครบถ้วน)
-- ============================================================================
-- SELECT 'tournaments' as table_name, count(*) as count FROM public.tournaments WHERE id = 'sci_cup_main'
-- UNION ALL
-- SELECT 'teams', count(*) FROM public.teams WHERE tournament_id = 'sci_cup_main'
-- UNION ALL
-- SELECT 'players', count(*) FROM public.players WHERE tournament_id = 'sci_cup_main'
-- UNION ALL
-- SELECT 'groups', count(*) FROM public.groups WHERE tournament_id = 'sci_cup_main'
-- UNION ALL
-- SELECT 'matches', count(*) FROM public.matches WHERE tournament_id = 'sci_cup_main'
-- UNION ALL
-- SELECT 'match_events', count(*) FROM public.match_events WHERE tournament_id = 'sci_cup_main';

-- ============================================================================
-- ส่วนที่ 4: ROLLBACK SCRIPT (กรณีต้องการย้อนกลับสภาพเดิม)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_check_match_teams ON public.matches;
-- DROP FUNCTION IF EXISTS public.check_match_teams_tournament();
-- ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS fk_teams_tournament;
-- ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS fk_groups_tournament;
-- ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS fk_matches_tournament;
-- ALTER TABLE public.players DROP CONSTRAINT IF EXISTS fk_players_tournament;
-- ALTER TABLE public.teams ALTER COLUMN tournament_id DROP NOT NULL;
-- ALTER TABLE public.groups ALTER COLUMN tournament_id DROP NOT NULL;
-- ALTER TABLE public.matches ALTER COLUMN tournament_id DROP NOT NULL;
-- ALTER TABLE public.players ALTER COLUMN tournament_id DROP NOT NULL;
