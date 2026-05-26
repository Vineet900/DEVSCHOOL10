-- ============================================================
-- DevSchool Pro — Performance Indexes
-- ============================================================
-- Without these indexes, every query does a full table scan.
-- With 1M users: leaderboard = 10s. With index: <50ms.
-- ============================================================

-- ─── Profiles ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ─── User Progress (hottest table — queried on every lesson load) ─────
CREATE INDEX IF NOT EXISTS idx_progress_user_lesson ON user_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_completed ON user_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON user_progress(lesson_id);

-- ─── Enrollments ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ─── Quizzes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);

-- ─── Quiz Attempts ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts(attempted_at DESC);

-- ─── Notifications ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at DESC);

-- ─── Redeem Requests ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_redeems_user ON redeem_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_redeems_status ON redeem_requests(status);

-- ─── Sections / Lessons ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort ON lessons(section_id, sort_order);

-- ─── Admin Logs ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_logs_date ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);

-- ─── AI Token Logs ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_token_logs_user ON ai_token_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_logs_date ON ai_token_logs(created_at DESC);

-- ─── XP Logs ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_date ON xp_logs(created_at DESC);

-- ─── Certificates ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(verification_code);

-- ─── Moderation ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_date ON moderation_reports(created_at DESC);
