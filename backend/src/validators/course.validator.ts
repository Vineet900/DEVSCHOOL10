import { z } from 'zod';

// ─── Course Validators (Public/User Facing) ───────────────────────────────────

export const courseIdParamSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
});

export const lessonIdParamSchema = z.object({
  id: z.string().uuid('Invalid lesson ID'),
});

export const enrollSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

// ─── Progress Validators ──────────────────────────────────────────────────────

export const updateProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  isCompleted: z.boolean().default(true),
  // SECURITY: No xp field here — XP is awarded server-side via RPC
});

// ─── Quiz Submit Validator ────────────────────────────────────────────────────

export const submitQuizSchema = z.object({
  answers: z.array(z.number().int().min(0)).min(1).max(50),
  // SECURITY: No score field — server calculates score
});

// ─── Certificate Validator ────────────────────────────────────────────────────

export const generateCertificateSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const verifyCertificateSchema = z.object({
  code: z.string().min(5).max(50),
});

// ─── Redeem Request Validator ─────────────────────────────────────────────────

export const createRedeemSchema = z.object({
  reward_title: z.string().min(1).max(200),
  points_cost: z.coerce.number().int().min(1),
});
