-- ============================================================
-- DevSchool Pro — Atomic Database Functions
-- ============================================================
-- These RPC functions run inside PostgreSQL transactions.
-- They eliminate race conditions by doing atomic read+write.
-- Called via: supabase.rpc('function_name', { params })
-- Or via: Prisma $queryRaw / pg client
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── FIX #1: Atomic AI Token Deduction ────────────────────
-- THE PROBLEM:
--   Old code: Read ai_tokens → calculate (tokens - 1) → write back
--   Under concurrency: 50 requests read "5", all write "4". Only 1 deducted.
--
-- THE FIX:
--   Single UPDATE with WHERE ai_tokens > 0. Atomic. No race condition.
--   Returns success/failure + remaining count as JSONB.

CREATE OR REPLACE FUNCTION deduct_ai_token(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE profiles
  SET ai_tokens = ai_tokens - 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND ai_tokens > 0
  RETURNING ai_tokens INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_tokens'
    );
  END IF;

  -- Log the deduction for audit trail
  INSERT INTO ai_token_logs (user_id, action, tokens_change, balance_after)
  VALUES (p_user_id, 'DEDUCT', -1, v_remaining);

  RETURN jsonb_build_object(
    'success', true,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Admin Token Refill ──────────────────────────────────
-- Used by admin panel to add tokens to a user's account.
-- Logs the admin action for audit.

CREATE OR REPLACE FUNCTION refill_ai_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 OR p_amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE profiles
  SET ai_tokens = ai_tokens + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING ai_tokens INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Audit log
  INSERT INTO ai_token_logs (user_id, action, tokens_change, balance_after)
  VALUES (p_user_id, 'REFILL', p_amount, v_new_balance);

  INSERT INTO admin_logs (admin_id, action, target_id, details)
  VALUES (p_admin_id, 'REFILL_AI_TOKENS', p_user_id::text,
    jsonb_build_object('amount', p_amount, 'new_balance', v_new_balance));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Atomic XP Award (Server-Side Only) ──────────────────
-- FIX: XP/SP must NEVER come from frontend.
-- Only this function can add XP. Controllers call it after verified actions.

CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT  -- e.g., 'LESSON_COMPLETE', 'QUIZ_PASS', 'STREAK_BONUS'
)
RETURNS JSONB AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  IF p_xp_amount <= 0 OR p_xp_amount > 1000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE profiles
  SET xp = xp + p_xp_amount,
      level = GREATEST(1, FLOOR((xp + p_xp_amount) / 100)::INTEGER),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING xp, level INTO v_new_xp, v_new_level;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Log the XP award
  INSERT INTO xp_logs (user_id, xp_change, source, balance_after)
  VALUES (p_user_id, p_xp_amount, p_source, v_new_xp);

  RETURN jsonb_build_object(
    'success', true,
    'xp', v_new_xp,
    'level', v_new_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Atomic Study Points Conversion ──────────────────────
-- Convert XP to SP safely — no client manipulation possible.

CREATE OR REPLACE FUNCTION convert_xp_to_sp(
  p_user_id UUID,
  p_xp_amount INTEGER
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

  -- 100 XP = 1 SP
  v_sp_earned := FLOOR(p_xp_amount / 100);
  IF v_sp_earned <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_enough_xp');
  END IF;

  UPDATE profiles
  SET xp = GREATEST(0, xp - (v_sp_earned * 100)),
      study_points = study_points + v_sp_earned,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND xp >= (v_sp_earned * 100)
  RETURNING xp, study_points INTO v_new_xp, v_new_sp;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_xp');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xp', v_new_xp,
    'study_points', v_new_sp,
    'sp_earned', v_sp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
