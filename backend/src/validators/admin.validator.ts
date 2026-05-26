import { z } from 'zod';

// ─── Admin Validators ─────────────────────────────────────────────────────────
// FIX #2: Mass Assignment — req.body is NEVER passed directly to DB.
// Every field must be explicitly whitelisted in these schemas.
// Zod strips unknown fields automatically.

// ─── User Management ──────────────────────────────────────
export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  is_banned: z.boolean().optional(),
  // SECURITY: These fields are NOT allowed via admin update:
  // - xp, study_points, ai_tokens (use dedicated RPCs)
  // - user_id, email (immutable)
  // - password (use auth system)
});

export const banUserSchema = z.object({
  banned: z.boolean(),
});

// ─── Course Management ────────────────────────────────────
export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().url().optional(),
  slug: z.string().max(200).optional(),
  is_published: z.boolean().default(false),
  roadmap_id: z.string().uuid().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

// ─── Section Management ───────────────────────────────────
export const createSectionSchema = z.object({
  title: z.string().min(1).max(200),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const updateSectionSchema = createSectionSchema.partial();

export const bulkSectionsSchema = z.object({
  sections: z.array(z.object({
    title: z.string().min(1).max(200),
    sort_order: z.coerce.number().int().min(0).default(0),
  })).min(1).max(50),
});

// ─── Lesson Management ───────────────────────────────────
export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000).optional(),
  video_url: z.string().url().optional(),
  duration: z.coerce.number().int().min(0).default(0),
  sort_order: z.coerce.number().int().min(0).default(0),
  chapter_number: z.coerce.number().int().min(0).default(0),
  xp_reward: z.coerce.number().int().min(0).max(500).default(10),
  slug: z.string().max(200).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

// ─── Quiz Management ─────────────────────────────────────
export const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  lesson_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  questions: z.array(z.object({
    question: z.string().min(1).max(1000),
    options: z.array(z.string().max(500)).min(2).max(6),
    answer_index: z.number().int().min(0),
    explanation: z.string().max(1000).optional(),
  })).min(1).max(50),
  xp_reward: z.coerce.number().int().min(0).max(500).default(20),
});

// ─── Settings Management ─────────────────────────────────
// FIX #3: Settings go to DB, not .env file
export const updateSettingsSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(5000),
});

export const bulkSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().min(1).max(100),
    value: z.string().max(5000),
  })).min(1).max(20),
});

// ─── Notification Sending ─────────────────────────────────
export const sendNotificationSchema = z.object({
  targetType: z.enum(['ALL', 'SELECTED']),
  userIds: z.array(z.string().uuid()).optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['SYSTEM', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'WARNING']).default('SYSTEM'),
});

// ─── Redeem Status Update ─────────────────────────────────
export const updateRedeemSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

// ─── Moderation ───────────────────────────────────────────
export const resolveModerationSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
});

export const deleteFlaggedContentSchema = z.object({
  contentType: z.enum(['ROADMAP', 'USER']),
  contentId: z.string().uuid(),
});

// ─── Token Refill (Admin) ─────────────────────────────────
export const refillTokensSchema = z.object({
  amount: z.coerce.number().int().min(1).max(10000),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
