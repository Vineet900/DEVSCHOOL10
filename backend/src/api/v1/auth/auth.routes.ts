import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { loginLimiter, registerLimiter, otpLimiter } from '../../../middleware/rateLimiter.middleware.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, verifyOtpSchema, updateProfileSchema } from '../../../validators/auth.validator.js';
import { supabase } from '../../../lib/supabase.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { logger } from '../../../lib/logger.js';

const router = Router();

// ─── POST /api/v1/auth/register ───────────────────────────
router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, username, fullName } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
      },
    },
  });

  if (error) {
    return sendError(res, error.message, { statusCode: 400, code: 'AUTH_ERROR' });
  }

  return sendSuccess(res, {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: data.session,
    message: 'Registration successful. Please check your email for verification.',
  }, { statusCode: 201, message: 'User registered' });
}));

// ─── POST /api/v1/auth/login ──────────────────────────────
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return sendError(res, 'Invalid email or password', { statusCode: 401, code: 'AUTH_ERROR' });
  }

  // Fetch or create profile
  let profile = await userRepository.findByUserId(data.user.id);

  if (!profile) {
    const meta = data.user.user_metadata ?? {};
    profile = await userRepository.createProfile({
      user_id: data.user.id,
      email: data.user.email ?? undefined,
      full_name: (meta['full_name'] as string) || (meta['name'] as string) || undefined,
      avatar_url: (meta['avatar_url'] as string) || (meta['picture'] as string) || undefined,
    });
  }

  // Check ban status
  if (profile?.is_banned) {
    return sendError(res, 'Your account has been suspended', { statusCode: 403, code: 'ACCOUNT_BANNED' });
  }

  return sendSuccess(res, {
    user: {
      id: data.user.id,
      email: data.user.email,
      profile,
    },
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
  }, { message: 'Login successful' });
}));

// ─── POST /api/v1/auth/verify ─────────────────────────────
router.post('/verify', otpLimiter, validate(verifyOtpSchema), asyncHandler(async (req, res) => {
  const { email, otp, type } = req.body;

  const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type });

  if (error) {
    return sendError(res, 'Invalid or expired OTP', { statusCode: 400, code: 'OTP_ERROR' });
  }

  return sendSuccess(res, {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    session: data.session,
  }, { message: 'Email verified successfully' });
}));

// ─── GET /api/v1/auth/me ──────────────────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← ALWAYS from JWT

  const profile = await userRepository.findByUserId(userId);

  return sendSuccess(res, {
    user: {
      id: req.user.id,
      email: req.user.email,
      profile,
    },
  });
}));

// ─── PUT /api/v1/auth/profile ─────────────────────────────
router.put('/profile', protect, validate(updateProfileSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← ALWAYS from JWT, never from body

  const updated = await userRepository.updateProfile(userId, req.body);

  return sendSuccess(res, updated, { message: 'Profile updated' });
}));

// ─── POST /api/v1/auth/logout ─────────────────────────────
router.post('/logout', protect, asyncHandler(async (_req, res) => {
  // Server-side: Supabase session revocation
  // Client-side: clear token from localStorage/cookies

  res.clearCookie('token');
  return sendSuccess(res, null, { message: 'Logged out successfully' });
}));

// ─── POST /api/v1/auth/refresh ────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token required', { statusCode: 400 });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error) {
    return sendError(res, 'Invalid refresh token', { statusCode: 401 });
  }

  return sendSuccess(res, {
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
  });
}));

// ─── POST /api/v1/auth/google ─────────────────────────────
router.post('/google', asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return sendError(res, 'ID token required', { statusCode: 400 });
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    logger.warn('[Auth] Google sign-in failed', { error: error.message });
    return sendError(res, 'Google sign-in failed', { statusCode: 401 });
  }

  let profile = await userRepository.findByUserId(data.user.id);

  if (!profile) {
    const meta = data.user.user_metadata ?? {};
    profile = await userRepository.createProfile({
      user_id: data.user.id,
      email: data.user.email ?? undefined,
      full_name: (meta['full_name'] as string) || (meta['name'] as string) || undefined,
      avatar_url: (meta['avatar_url'] as string) || (meta['picture'] as string) || undefined,
    });
  }

  return sendSuccess(res, {
    user: { id: data.user.id, email: data.user.email, profile },
    token: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    isNewUser: !profile,
  }, { message: 'Google sign-in successful' });
}));

export default router;
