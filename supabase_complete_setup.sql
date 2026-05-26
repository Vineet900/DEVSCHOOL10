-- ============================================================
-- DevSchool Pro — Supabase Complete SQL Setup
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This creates the FULL schema + RLS + functions + indexes.
-- 
-- NOTE: With Docker PostgreSQL, this runs automatically via
-- docker-entrypoint-initdb.d. For Supabase-hosted DB, paste here.
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- PART 1: EXTENSIONS
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════
-- PART 2: TABLES
-- ═══════════════════════════════════════════════════════════

-- ─── Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL,
  username     VARCHAR(50) UNIQUE,
  full_name    VARCHAR(100),
  email        VARCHAR(255),
  avatar_url   TEXT,
  bio          TEXT,
  role         VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  xp           INTEGER NOT NULL DEFAULT 0,
  level        INTEGER NOT NULL DEFAULT 1,
  study_points INTEGER NOT NULL DEFAULT 0,
  study_hours  REAL NOT NULL DEFAULT 0,
  ai_tokens    INTEGER NOT NULL DEFAULT 50,
  streak       INTEGER NOT NULL DEFAULT 0,
  accuracy     REAL NOT NULL DEFAULT 0,
  is_banned    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  thumbnail    TEXT,
  slug         VARCHAR(200) UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  roadmap_id   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sections ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Lessons ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id     UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  course_id      UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  content        TEXT,
  video_url      TEXT,
  duration       INTEGER NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  chapter_number INTEGER NOT NULL DEFAULT 0,
  xp_reward      INTEGER NOT NULL DEFAULT 10,
  slug           VARCHAR(200),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Progress ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  lesson_id    UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ─── Enrollments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── Quizzes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id  UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  questions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_reward  INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Quiz Attempts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  quiz_id      UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score        REAL NOT NULL DEFAULT 0,
  answers      JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Redeem Requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.redeem_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  reward_title VARCHAR(200) NOT NULL,
  points_cost  INTEGER NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Coupons ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       VARCHAR(50) UNIQUE NOT NULL,
  discount   INTEGER NOT NULL DEFAULT 0,
  max_uses   INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Moderation Reports ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id      UUID NOT NULL,
  reported_user_id UUID,
  content_type     VARCHAR(50),
  content_id       UUID,
  reason           TEXT NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Certificates ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL,
  course_id         UUID NOT NULL REFERENCES public.courses(id),
  verification_code VARCHAR(50) UNIQUE NOT NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── User Roadmaps ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roadmaps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Admin Logs (Audit Trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID NOT NULL,
  action     VARCHAR(100) NOT NULL,
  target_id  TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Token Logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_token_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,
  action        VARCHAR(20) NOT NULL,
  tokens_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── XP Logs (Anti-Cheat) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,
  xp_change     INTEGER NOT NULL,
  source        VARCHAR(50) NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── App Settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key          VARCHAR(100) PRIMARY KEY,
  value        TEXT NOT NULL DEFAULT '',
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  updated_by   UUID,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
-- PART 3: INDEXES (Performance)
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON public.user_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_completed ON public.user_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON public.user_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON public.quiz_attempts(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redeems_user ON public.redeem_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_redeems_status ON public.redeem_requests(status);

CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON public.lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort ON public.lessons(section_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_token_logs_user ON public.ai_token_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON public.xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON public.moderation_reports(status);


-- ═══════════════════════════════════════════════════════════
-- PART 4: ATOMIC FUNCTIONS (RPC)
-- ═══════════════════════════════════════════════════════════

-- ─── Atomic AI Token Deduction ────────────────────────────
-- Prevents race condition: single UPDATE, no read-then-write
CREATE OR REPLACE FUNCTION public.deduct_ai_token(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.profiles
  SET ai_tokens = ai_tokens - 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND ai_tokens > 0
  RETURNING ai_tokens INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_tokens');
  END IF;

  INSERT INTO public.ai_token_logs (user_id, action, tokens_change, balance_after)
  VALUES (p_user_id, 'DEDUCT', -1, v_remaining);

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin Token Refill ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.refill_ai_tokens(
  p_user_id UUID, p_amount INTEGER, p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 OR p_amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE public.profiles
  SET ai_tokens = ai_tokens + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING ai_tokens INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  INSERT INTO public.ai_token_logs (user_id, action, tokens_change, balance_after)
  VALUES (p_user_id, 'REFILL', p_amount, v_new_balance);

  INSERT INTO public.admin_logs (admin_id, action, target_id, details)
  VALUES (p_admin_id, 'REFILL_AI_TOKENS', p_user_id::text,
    jsonb_build_object('amount', p_amount, 'new_balance', v_new_balance));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Atomic XP Award ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID, p_xp_amount INTEGER, p_source TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF p_xp_amount <= 0 OR p_xp_amount > 1000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE public.profiles
  SET xp = xp + p_xp_amount,
      level = GREATEST(1, FLOOR((xp + p_xp_amount) / 100)::INTEGER),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING xp, level INTO v_new_xp, v_new_level;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  INSERT INTO public.xp_logs (user_id, xp_change, source, balance_after)
  VALUES (p_user_id, p_xp_amount, p_source, v_new_xp);

  RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── XP to SP Conversion ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.convert_xp_to_sp(
  p_user_id UUID, p_xp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_sp_earned INTEGER;
  v_new_xp INTEGER;
  v_new_sp INTEGER;
BEGIN
  IF p_xp_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  v_sp_earned := FLOOR(p_xp_amount / 100);
  IF v_sp_earned <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_enough_xp');
  END IF;

  UPDATE public.profiles
  SET xp = GREATEST(0, xp - (v_sp_earned * 100)),
      study_points = study_points + v_sp_earned,
      updated_at = NOW()
  WHERE user_id = p_user_id AND xp >= (v_sp_earned * 100)
  RETURNING xp, study_points INTO v_new_xp, v_new_sp;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_xp');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'xp', v_new_xp, 'study_points', v_new_sp, 'sp_earned', v_sp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════
-- These policies protect data at the DATABASE level.
-- Even if the API has bugs, the DB won't leak data.

-- ─── Enable RLS on all tables ─────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_token_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────
-- Users can read their own profile. Public fields readable by all.
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (backend) bypasses RLS automatically

-- ─── User Progress ────────────────────────────────────────
CREATE POLICY progress_select_own ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY progress_insert_own ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY progress_update_own ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Enrollments ──────────────────────────────────────────
CREATE POLICY enrollments_select_own ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY enrollments_insert_own ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Notifications ────────────────────────────────────────
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Quiz Attempts ────────────────────────────────────────
CREATE POLICY quiz_attempts_select_own ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quiz_attempts_insert_own ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Redeem Requests ──────────────────────────────────────
CREATE POLICY redeems_select_own ON public.redeem_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY redeems_insert_own ON public.redeem_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── User Roadmaps ───────────────────────────────────────
CREATE POLICY roadmaps_select_own ON public.user_roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY roadmaps_insert_own ON public.user_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY roadmaps_delete_own ON public.user_roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- ─── AI Token Logs (Read-only for users) ──────────────────
CREATE POLICY ai_logs_select_own ON public.ai_token_logs
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT policy — only server (service_role) can insert

-- ─── XP Logs (Read-only for users) ───────────────────────
CREATE POLICY xp_logs_select_own ON public.xp_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Admin Logs (Admin only) ─────────────────────────────
CREATE POLICY admin_logs_select ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ─── Certificates ─────────────────────────────────────────
CREATE POLICY certificates_select_own ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Courses, Sections, Lessons, Quizzes — Public Read ───
-- These are public content, readable by anyone (including anonymous)
-- Only admins can modify (handled by service_role in backend)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_public_read ON public.courses
  FOR SELECT USING (true);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sections_public_read ON public.sections
  FOR SELECT USING (true);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY lessons_public_read ON public.lessons
  FOR SELECT USING (true);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quizzes_public_read ON public.quizzes
  FOR SELECT USING (true);

-- ─── App Settings — Public read, Admin write ─────────────
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_public_read ON public.app_settings
  FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════
-- PART 6: DEFAULT DATA
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.app_settings (key, value) VALUES
  ('SITE_NAME', 'DevSchool Pro'),
  ('MAINTENANCE_MODE', 'false'),
  ('REGISTRATION_ENABLED', 'true'),
  ('EMAIL_NOTIFICATIONS', 'true'),
  ('SUPPORT_EMAIL', 'support@devschool.com'),
  ('AI_TUTOR_MODEL', 'gemini-2.0-flash')
ON CONFLICT (key) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- PART 7: AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ═══════════════════════════════════════════════════════════
-- When a new user signs up via Supabase Auth, automatically
-- create a profile row so they can start using the app.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'STUDENT'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════
-- ✅ SETUP COMPLETE
-- ════════════════════════════════════════════════════════════
-- Tables:    17
-- Indexes:   30+
-- Functions: 4 (atomic RPC)
-- RLS:       20+ policies
-- Triggers:  1 (auto profile creation)
-- ════════════════════════════════════════════════════════════
