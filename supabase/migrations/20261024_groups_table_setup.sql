-- ==============================================================================
-- SCIENCE CUP 2026: GROUPS TABLE RLS POLICIES & SETUP
-- Migration: 20261024_groups_table_setup.sql
-- ==============================================================================

-- 1. ตรวจสอบให้แน่ใจว่าตาราง groups มีโครงสร้างและ index ที่สมบูรณ์
CREATE TABLE IF NOT EXISTS public.groups (
    id SERIAL PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_groups_tournament FOREIGN KEY (tournament_id) 
        REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_groups_tournament_id ON public.groups(tournament_id);

-- 2. เปิดใช้งาน RLS (Row Level Security) สำหรับ groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 3. นโยบาย (Policies)
-- ผู้ชมทั่วไปสามารถอ่านรายชื่อกลุ่มได้
DROP POLICY IF EXISTS "Public can view groups" ON public.groups;
CREATE POLICY "Public can view groups"
ON public.groups FOR SELECT
USING (true);

-- แอดมินและเจ้าของทัวร์นาเมนต์สามารถ เพิ่ม/แก้ไข/ลบ กลุ่มได้
DROP POLICY IF EXISTS "Tournament admins can insert groups" ON public.groups;
CREATE POLICY "Tournament admins can insert groups"
ON public.groups FOR INSERT
WITH CHECK (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']) OR public.is_global_admin());

DROP POLICY IF EXISTS "Tournament admins can update groups" ON public.groups;
CREATE POLICY "Tournament admins can update groups"
ON public.groups FOR UPDATE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']) OR public.is_global_admin());

DROP POLICY IF EXISTS "Tournament admins can delete groups" ON public.groups;
CREATE POLICY "Tournament admins can delete groups"
ON public.groups FOR DELETE
USING (public.has_tournament_role(tournament_id, ARRAY['owner', 'admin']) OR public.is_global_admin());
