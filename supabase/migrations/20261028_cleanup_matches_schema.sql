-- =============================================================================
-- Migration: Cleanup redundant columns in public.matches (Idempotent & Safe)
-- Purpose: Keep only normalized scheduling & result columns in public.matches
-- =============================================================================

BEGIN;

-- 1. ตรวจสอบว่าคอลัมน์หลักที่ต้องใช้งานมีอยู่ครบ (หากยังไม่มีให้สร้างเพิ่ม)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_number INTEGER,
  ADD COLUMN IF NOT EXISTS matchday INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'group',
  ADD COLUMN IF NOT EXISTS round_name TEXT,
  ADD COLUMN IF NOT EXISTS group_name TEXT,
  ADD COLUMN IF NOT EXISTS match_date TEXT,
  ADD COLUMN IF NOT EXISTS match_time TEXT,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SCHEDULED',
  ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS home_penalty_score INTEGER,
  ADD COLUMN IF NOT EXISTS away_penalty_score INTEGER;

-- 2. โอนย้ายข้อมูลจากคอลัมน์เก่า (เฉพาะกรณีที่คอลัมน์เก่านั้นยังมีอยู่ในตาราง)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'pitch'
  ) THEN
    EXECUTE 'UPDATE public.matches SET venue = COALESCE(NULLIF(venue, ''''), pitch, ''สนาม 1'')';
  ELSE
    UPDATE public.matches SET venue = COALESCE(NULLIF(venue, ''), 'สนาม 1');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'round'
  ) THEN
    EXECUTE 'UPDATE public.matches SET round_name = COALESCE(NULLIF(round_name, ''''), round, CASE WHEN stage = ''knockout'' THEN ''รอบน็อคเอาท์'' ELSE ''รอบแบ่งกลุ่ม (Group Stage)'' END)';
  ELSE
    UPDATE public.matches
    SET round_name = COALESCE(NULLIF(round_name, ''), CASE WHEN stage = 'knockout' THEN 'รอบน็อคเอาท์' ELSE 'รอบแบ่งกลุ่ม (Group Stage)' END);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'penalty_home_score'
  ) THEN
    EXECUTE 'UPDATE public.matches SET home_penalty_score = COALESCE(home_penalty_score, penalty_home_score)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'penalty_away_score'
  ) THEN
    EXECUTE 'UPDATE public.matches SET away_penalty_score = COALESCE(away_penalty_score, penalty_away_score)';
  END IF;
END $$;

-- 3. กำหนดลำดับคู่แข่งขัน (match_number) ให้แมตช์เดิมที่ยังไม่มีลำดับ
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tournament_id ORDER BY match_number ASC NULLS LAST, id ASC) AS rn
  FROM public.matches
)
UPDATE public.matches m
SET match_number = numbered.rn
FROM numbered
WHERE m.id = numbered.id
  AND (m.match_number IS NULL OR m.match_number <= 0);

-- 4. ลบคอลัมน์ที่ซ้ำซ้อนและไม่ได้ใช้งานออกทั้งหมด (ใช้ IF EXISTS ป้องกัน Error หากถูกลบไปแล้ว)
ALTER TABLE public.matches
  DROP COLUMN IF EXISTS penalty_home_score,
  DROP COLUMN IF EXISTS penalty_away_score,
  DROP COLUMN IF EXISTS pitch,
  DROP COLUMN IF EXISTS round,
  DROP COLUMN IF EXISTS group_id,
  DROP COLUMN IF EXISTS home_team_name,
  DROP COLUMN IF EXISTS away_team_name,
  DROP COLUMN IF EXISTS home_team_logo,
  DROP COLUMN IF EXISTS away_team_logo,
  DROP COLUMN IF EXISTS status_label,
  DROP COLUMN IF EXISTS current_minute,
  DROP COLUMN IF EXISTS winner_team_id,
  DROP COLUMN IF EXISTS next_match_id;

-- 5. สร้าง Index เพื่อให้ดึงตารางแข่งตามทัวร์นาเมนต์และลำดับคู่ได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_matches_tournament_order
  ON public.matches (tournament_id, match_number ASC, id ASC);

COMMIT;
