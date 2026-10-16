-- ============================================================================
-- SCI CUP: Supabase Storage Configuration & RLS Policies
-- Migration: 20261016_storage_setup.sql
-- Goal: Set up team-logos public storage bucket and safe access policies
-- ============================================================================

-- 1. สร้าง Bucket 'team-logos' หากยังไม่มี (กำหนดเป็น Public และจำกัดขนาด 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-logos',
    'team-logos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- 2. นโยบายความปลอดภัย (RLS Policies) บน storage.objects สำหรับ 'team-logos'

-- อนุญาตให้ทุกคน (รวมทั้งผู้เยี่ยมชม/สาธารณะ) สามารถดูและดาวน์โหลดรูปโลโก้ได้
DROP POLICY IF EXISTS "Public can view team logos" ON storage.objects;
CREATE POLICY "Public can view team logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

-- อนุญาตให้อัปโหลดรูปโลโก้
DROP POLICY IF EXISTS "Allow upload team logos" ON storage.objects;
CREATE POLICY "Allow upload team logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-logos');

-- อนุญาตให้อัปเดตรูปโลโก้
DROP POLICY IF EXISTS "Allow update team logos" ON storage.objects;
CREATE POLICY "Allow update team logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-logos');

-- อนุญาตให้ลบรูปโลโก้
DROP POLICY IF EXISTS "Allow delete team logos" ON storage.objects;
CREATE POLICY "Allow delete team logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-logos');

-- 3. เพิ่มคอลัมน์ logo_path ในตาราง teams เพื่อเก็บ storage path อย่างปลอดภัย
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_path TEXT;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS logo_path TEXT;
