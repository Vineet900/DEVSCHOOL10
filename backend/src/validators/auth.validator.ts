import { z } from 'zod';

// ─── Auth Validators ──────────────────────────────────────────────────────────
// Strict input validation for all auth endpoints.
// Prevents ReDoS attacks, SQL injection via email, and payload abuse.

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  fullName: z.string().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  type: z.enum(['signup', 'magiclink', 'recovery']).default('signup'),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  full_name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  // SECURITY: xp, study_points, ai_tokens, role are NOT allowed here
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
