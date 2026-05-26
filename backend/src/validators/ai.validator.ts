import { z } from 'zod';

// ─── AI Validators ────────────────────────────────────────────────────────────
// FIX #5 (IDOR): userId field is NOT in any of these schemas.
// The user identity is ALWAYS derived from req.user (JWT).
// FIX #6 (API Key): customApiKey is NOT in body schemas.
// It's only accepted via X-Custom-Api-Key header.

export const askTeacherSchema = z.object({
  question: z.string().min(2, 'Question is too short').max(2000, 'Question is too long'),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  language: z.string().max(10).default('en'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string().max(5000),
  })).max(20).optional(), // Cap history to prevent prompt injection via length
});

export const generateQuizSchema = z.object({
  topic: z.string().min(2).max(200),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.coerce.number().int().min(1).max(20).default(5),
  language: z.string().max(10).default('en'),
});

export const generateRoadmapSchema = z.object({
  goal: z.string().min(5).max(500),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  timeframe: z.string().max(50).default('3 months'),
  language: z.string().max(10).default('en'),
});

export const dailyPlanSchema = z.object({
  language: z.string().max(10).default('en'),
});

export type AskTeacherInput = z.infer<typeof askTeacherSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
