-- Migration: Add status column to tournaments table if not exists
-- Run this in Supabase SQL Editor if you want the status column directly in the database table

ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
COMMENT ON COLUMN public.tournaments.status IS 'Tournament status: ACTIVE, DRAFT, COMPLETED';

