-- Migration: Add learning stats columns to profiles table
-- Run this in your Supabase SQL Editor

-- Add study_points (Study Points / SP balance tracked in the app)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS study_points INTEGER DEFAULT 0 CHECK (study_points >= 0);

-- Add streak (daily learning streak count)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0 CHECK (streak >= 0);

-- Add accuracy (assessment accuracy percentage 0-100)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2) DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100);

-- Add progress (JSONB: map of "courseId:chapterId" → true for completed chapters)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}';

-- Add quiz_scores (JSONB: map of courseId → score)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_scores JSONB DEFAULT '{}';

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
