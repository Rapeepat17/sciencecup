-- ==============================================================================
-- SCIENCE CUP 2026: NUMERIC TOURNAMENT ID MIGRATION (1000, 1001, 1002, ...)
-- ==============================================================================

BEGIN;

-- 1. อัปเดต Foreign Key Constraints ให้รองรับ ON UPDATE CASCADE
ALTER TABLE IF EXISTS public.tournament_members DROP CONSTRAINT IF EXISTS fk_members_tournament;
ALTER TABLE IF EXISTS public.tournament_members
    ADD CONSTRAINT fk_members_tournament FOREIGN KEY (tournament_id) 
    REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'groups') THEN
        ALTER TABLE IF EXISTS public.groups DROP CONSTRAINT IF EXISTS fk_groups_tournament;
        ALTER TABLE public.groups
            ADD CONSTRAINT fk_groups_tournament FOREIGN KEY (tournament_id) 
            REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE IF EXISTS public.teams DROP CONSTRAINT IF EXISTS fk_teams_tournament;
ALTER TABLE public.teams
    ADD CONSTRAINT fk_teams_tournament FOREIGN KEY (tournament_id) 
    REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.players DROP CONSTRAINT IF EXISTS fk_players_tournament;
ALTER TABLE public.players
    ADD CONSTRAINT fk_players_tournament FOREIGN KEY (tournament_id) 
    REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.matches DROP CONSTRAINT IF EXISTS fk_matches_tournament;
ALTER TABLE public.matches
    ADD CONSTRAINT fk_matches_tournament FOREIGN KEY (tournament_id) 
    REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.match_events DROP CONSTRAINT IF EXISTS fk_events_tournament;
ALTER TABLE public.match_events
    ADD CONSTRAINT fk_events_tournament FOREIGN KEY (tournament_id) 
    REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- 2. อัปเดต ID ทัวร์นาเมนต์เดิม 5 รายการให้เป็นตัวเลข 1000 - 1004
-- (ข้อมูลในตารางทีม, นักกีฬา, แมตช์, เหตุการณ์ จะอัปเดตตามอัตโนมัติด้วย CASCADE)
UPDATE public.tournaments SET id = '1000' WHERE id = 'sci_cup_main';
UPDATE public.tournaments SET id = '1001' WHERE id = 'sci-messi-cup1';
UPDATE public.tournaments SET id = '1002' WHERE id = 'sci-romdon-cup';
UPDATE public.tournaments SET id = '1003' WHERE id = 'sci-ta2027';
UPDATE public.tournaments SET id = '1004' WHERE id = 'sci-vidya50y';

-- 3. สร้าง Sequence สำหรับรัน ID ทัวร์นาเมนต์ใหม่อัตโนมัติ เริ่มต้นที่ 1005
CREATE SEQUENCE IF NOT EXISTS public.tournament_id_seq START WITH 1005;
SELECT setval('public.tournament_id_seq', 1004, true);

-- กำหนด Default ค่า id ให้ดึงเลขถัดไปจาก Sequence โดยอัตโนมัติ
ALTER TABLE public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournament_id_seq')::text;

COMMIT;
