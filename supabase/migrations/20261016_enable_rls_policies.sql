-- ============================================================================
-- SCI CUP: Supabase Row Level Security (RLS) & RBAC Policies
-- Migration: 20261016_enable_rls_policies.sql
-- Goal: Enforce database-level access control preventing unauthorized mutations
-- ============================================================================

-- 1. เปิดใช้งาน RLS บนทุกตาราง
ALTER TABLE IF EXISTS public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_members ENABLE ROW LEVEL SECURITY;

-- 2. ฟังก์ชันตรวจสอบสิทธิ์ผู้ใช้
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_tournament_role(t_id TEXT, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Global admin bypass
    IF public.is_global_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.tournament_members
        WHERE tournament_id = t_id
          AND profile_id = auth.uid()
          AND role = ANY(allowed_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. นโยบาย (Policies) สำหรับตาราง TOURNAMENTS
DROP POLICY IF EXISTS "Public can view active tournaments" ON public.tournaments;
CREATE POLICY "Public can view active tournaments"
ON public.tournaments FOR SELECT
USING (status = 'ACTIVE' OR public.is_global_admin() OR public.has_tournament_role(id, ARRAY['owner', 'admin', 'viewer']));

DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON public.tournaments;
CREATE POLICY "Authenticated users can create tournaments"
ON public.tournaments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and owners can update tournament" ON public.tournaments;
CREATE POLICY "Admins and owners can update tournament"
ON public.tournaments FOR UPDATE
USING (public.has_tournament_role(id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Only owners can delete tournament" ON public.tournaments;
CREATE POLICY "Only owners can delete tournament"
ON public.tournaments FOR DELETE
USING (id <> 'sci_cup_main' AND public.has_tournament_role(id, ARRAY['owner']));

-- 4. นโยบาย (Policies) สำหรับ TEAMS
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams"
ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tournament admins can insert teams" ON public.teams;
CREATE POLICY "Tournament admins can insert teams"
ON public.teams FOR INSERT
WITH CHECK (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Tournament admins can update teams" ON public.teams;
CREATE POLICY "Tournament admins can update teams"
ON public.teams FOR UPDATE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Tournament admins can delete teams" ON public.teams;
CREATE POLICY "Tournament admins can delete teams"
ON public.teams FOR DELETE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

-- 5. นโยบาย (Policies) สำหรับ MATCHES
DROP POLICY IF EXISTS "Public can view matches" ON public.matches;
CREATE POLICY "Public can view matches"
ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and scorekeepers can insert matches" ON public.matches;
CREATE POLICY "Admins and scorekeepers can insert matches"
ON public.matches FOR INSERT
WITH CHECK (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Admins and scorekeepers can update matches" ON public.matches;
CREATE POLICY "Admins and scorekeepers can update matches"
ON public.matches FOR UPDATE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin', 'scorekeeper']));

DROP POLICY IF EXISTS "Tournament admins can delete matches" ON public.matches;
CREATE POLICY "Tournament admins can delete matches"
ON public.matches FOR DELETE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

-- 6. นโยบาย (Policies) สำหรับ PLAYERS
DROP POLICY IF EXISTS "Public can view players" ON public.players;
CREATE POLICY "Public can view players"
ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tournament admins can insert players" ON public.players;
CREATE POLICY "Tournament admins can insert players"
ON public.players FOR INSERT
WITH CHECK (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Tournament admins can update players" ON public.players;
CREATE POLICY "Tournament admins can update players"
ON public.players FOR UPDATE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Tournament admins can delete players" ON public.players;
CREATE POLICY "Tournament admins can delete players"
ON public.players FOR DELETE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']));

-- 7. นโยบาย (Policies) สำหรับ MATCH_EVENTS
DROP POLICY IF EXISTS "Public can view match events" ON public.match_events;
CREATE POLICY "Public can view match events"
ON public.match_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Scorekeepers and admins can manage events" ON public.match_events;
CREATE POLICY "Scorekeepers and admins can manage events"
ON public.match_events FOR ALL
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin', 'scorekeeper']));

-- 8. นโยบาย (Policies) สำหรับ PROFILES
DROP POLICY IF EXISTS "Users can view own profile or global admin" ON public.profiles;
CREATE POLICY "Users can view own profile or global admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_global_admin());

DROP POLICY IF EXISTS "Users can update own profile without role change" ON public.profiles;
CREATE POLICY "Users can update own profile without role change"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
