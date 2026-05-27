-- ══════════════════════════════════════════════════════════════════════════════
-- DevSchoolPro Production Hardening Migrations
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. XP Award Ledger Table ─────────────────────────────────────────────────
-- Prevents duplicate XP awards via UNIQUE constraint.
-- Even if 50 concurrent threads call award_xp_idempotent, Postgres guarantees
-- only ONE insert succeeds due to the unique index.
CREATE TABLE IF NOT EXISTS public.xp_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  xp_amount INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'LESSON_COMPLETE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- THE critical constraint: one XP award per (user, lesson, source) triple
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_awards_unique
  ON public.xp_awards (user_id, lesson_id, source);

-- ─── 2. Idempotent XP Award Function ─────────────────────────────────────────
-- Uses INSERT ... ON CONFLICT DO NOTHING — if the unique constraint fires,
-- the function returns {success: false, reason: 'already_awarded'} instead
-- of awarding duplicate XP. This is TOCTTOU-proof.
CREATE OR REPLACE FUNCTION public.award_xp_idempotent(
  p_user_id UUID,
  p_lesson_id UUID,
  p_xp_amount INT,
  p_source TEXT DEFAULT 'LESSON_COMPLETE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INT;
  v_new_xp INT;
BEGIN
  -- Attempt to insert — ON CONFLICT DO NOTHING makes this idempotent
  INSERT INTO public.xp_awards (user_id, lesson_id, xp_amount, source)
  VALUES (p_user_id, p_lesson_id, p_xp_amount, p_source)
  ON CONFLICT (user_id, lesson_id, source) DO NOTHING;

  -- Check if the insert actually happened
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    -- Already awarded — no XP given
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_awarded'
    );
  END IF;

  -- Atomically add XP to the profile
  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + p_xp_amount
  WHERE user_id = p_user_id
  RETURNING xp INTO v_new_xp;

  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'new_total', v_new_xp
  );
END;
$$;

-- ─── 3. Critical Indexes for Performance ──────────────────────────────────────
-- These prevent full table scans on the most frequently queried columns.

-- Lessons: queried by section_id in nested course fetches
CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON public.lessons (section_id);

-- Sections: queried by course_id in nested course fetches
CREATE INDEX IF NOT EXISTS idx_sections_course_id ON public.sections (course_id);

-- User progress: queried by (user_id, lesson_id) on every progress check
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_unique
  ON public.user_progress (user_id, lesson_id);

-- User progress: filter by user + completion status
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed
  ON public.user_progress (user_id, is_completed);

-- Profiles: leaderboard queries sort by XP
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc
  ON public.profiles (xp DESC NULLS LAST);

-- Certificates: lookup by verification code
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS verification_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_verification_code
  ON public.certificates (verification_code);

-- Quiz attempts: user + quiz lookup
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz
  ON public.quiz_attempts (user_id, quiz_id);

-- ─── 4. Published courses index ───────────────────────────────────────────────
-- The catalog endpoint filters by is_published = true on every request
CREATE INDEX IF NOT EXISTS idx_courses_is_published
  ON public.courses (is_published) WHERE is_published = true;
