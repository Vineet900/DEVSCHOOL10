-- ============================================================
-- DevSchool Pro — Database Schema
-- ============================================================
-- Auto-runs on first Docker PostgreSQL boot via:
--   docker-compose volumes: ./sql:/docker-entrypoint-initdb.d:ro
-- Files execute in alphabetical order: 000_ → 001_ → 002_ → 003_
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles (User Data) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE NOT NULL,   -- Supabase Auth user ID
  username    VARCHAR(50) UNIQUE,
  full_name   VARCHAR(100),
  email       VARCHAR(255),
  avatar_url  TEXT,
  bio         TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'STUDENT',  -- STUDENT | INSTRUCTOR | ADMIN
  xp          INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  study_points INTEGER NOT NULL DEFAULT 0,
  study_hours  REAL NOT NULL DEFAULT 0,
  ai_tokens   INTEGER NOT NULL DEFAULT 50,
  streak      INTEGER NOT NULL DEFAULT 0,
  accuracy    REAL NOT NULL DEFAULT 0,
  is_banned   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
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
CREATE TABLE IF NOT EXISTS sections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Lessons ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id     UUID REFERENCES sections(id) ON DELETE CASCADE,
  course_id      UUID REFERENCES courses(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS user_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ─── Enrollments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── Quizzes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  questions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_reward  INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Quiz Attempts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score        REAL NOT NULL DEFAULT 0,
  answers      JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Redeem Requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS redeem_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  reward_title VARCHAR(200) NOT NULL,
  points_cost  INTEGER NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Coupons ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       VARCHAR(50) UNIQUE NOT NULL,
  discount   INTEGER NOT NULL DEFAULT 0,
  max_uses   INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Moderation Reports ──────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_reports (
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
CREATE TABLE IF NOT EXISTS certificates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL,
  course_id         UUID NOT NULL REFERENCES courses(id),
  verification_code VARCHAR(50) UNIQUE NOT NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ─── User Roadmaps ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roadmaps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Admin Logs (Audit Trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS admin_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID NOT NULL,
  action     VARCHAR(100) NOT NULL,
  target_id  TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Token Logs (Audit Trail) ─────────────────────────
CREATE TABLE IF NOT EXISTS ai_token_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,
  action        VARCHAR(20) NOT NULL, -- DEDUCT | REFILL
  tokens_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── XP Logs (Anti-Cheat Audit) ──────────────────────────
CREATE TABLE IF NOT EXISTS xp_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,
  xp_change     INTEGER NOT NULL,
  source        VARCHAR(50) NOT NULL, -- LESSON_COMPLETE | QUIZ_PASS | STREAK_BONUS
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── App Settings (DB-based, replaces .env mutation) ─────
CREATE TABLE IF NOT EXISTS app_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  updated_by  UUID,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('SITE_NAME', 'DevSchool Pro'),
  ('MAINTENANCE_MODE', 'false'),
  ('REGISTRATION_ENABLED', 'true'),
  ('EMAIL_NOTIFICATIONS', 'true'),
  ('SUPPORT_EMAIL', 'support@devschool.com'),
  ('AI_TUTOR_MODEL', 'gemini-2.0-flash')
ON CONFLICT (key) DO NOTHING;
