-- =============================================================================
-- Migration: Support Text & Placeholder Team IDs in public.matches
-- Purpose: Allow storing knockout placeholders ('A1', 'B2', 'คู่ชนะ 1') in home_team_id & away_team_id
-- Safe, idempotent, does not affect existing teams or match results.
-- =============================================================================

BEGIN;

-- 1. ลบ Foreign Key constraint เดิมที่ผูกกับตาราง teams ออก (เพื่อให้เก็บ 'A1', 'B2', 'คู่ชนะ 1' ได้)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'matches'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name IN (
            'matches_home_team_id_fkey',
            'matches_away_team_id_fkey',
            'fk_matches_home_team',
            'fk_matches_away_team'
          )
    ) LOOP
        EXECUTE 'ALTER TABLE public.matches DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 2. เปลี่ยนชนิดข้อมูลของ home_team_id และ away_team_id เป็น TEXT
-- ข้อมูลเดิมที่เป็นตัวเลข (เช่น 13, 14) จะถูกแปลงเป็นข้อความ ('13', '14') โดยที่ข้อมูลไม่สูญหาย
ALTER TABLE public.matches
  ALTER COLUMN home_team_id TYPE TEXT USING home_team_id::TEXT,
  ALTER COLUMN away_team_id TYPE TEXT USING away_team_id::TEXT;

-- 3. กำหนดให้เป็น Nullable (เพื่อความยืดหยุ่นในกรณีที่คู่แข่งขันยังไม่ระบุ)
ALTER TABLE public.matches
  ALTER COLUMN home_team_id DROP NOT NULL,
  ALTER COLUMN away_team_id DROP NOT NULL;

COMMIT;

