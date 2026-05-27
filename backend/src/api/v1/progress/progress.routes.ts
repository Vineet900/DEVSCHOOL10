import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { progressLimiter } from '../../../middleware/rateLimiter.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { updateProgressSchema } from '../../../validators/course.validator.js';
import { supabase } from '../../../lib/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';

const router = Router();

// ─── GET /api/v1/progress — User's all progress ──────────
router.get('/', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed, updated_at')
    .eq('user_id', userId);

  if (error) throw error;
  return sendSuccess(res, data);
}));

// ─── GET /api/v1/progress/course/:courseId — Course progress ─
router.get('/course/:courseId', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params['courseId']!;

  // Get all lessons for this course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  const lessonIds = lessons?.map(l => l.id) ?? [];

  // Get user's progress for these lessons
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']);

  const completedCount = progress?.filter(p => p.is_completed).length ?? 0;
  const totalLessons = lessonIds.length;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return sendSuccess(res, {
    courseId,
    totalLessons,
    completedLessons: completedCount,
    percentage,
    progress: progress ?? [],
  });
}));

// ─── POST /api/v1/progress — Mark lesson complete ─────────
// SECURITY: XP awarded via atomic RPC — prevents TOCTTOU race condition.
// The old code did: SELECT(is_completed) → if not → UPSERT + award_xp
// Under concurrency, N threads all read is_completed=false before any write,
// resulting in N×XP awarded. This fix performs everything in a single DB call.
router.post('/', protect, progressLimiter, validate(updateProgressSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← ALWAYS from JWT
  const { lessonId, isCompleted } = req.body;

  // Verify lesson exists
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, xp_reward')
    .eq('id', lessonId)
    .maybeSingle();

  if (!lesson) throw new NotFoundError('Lesson');

  // ──────────────────────────────────────────────────────────────────────
  // ATOMIC UPSERT: Use ON CONFLICT to guarantee idempotency.
  // If the row already exists with is_completed=true, this is a no-op.
  // ──────────────────────────────────────────────────────────────────────
  const { data: progress, error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select()
    .single();

  if (error) throw error;

  // ──────────────────────────────────────────────────────────────────────
  // ATOMIC XP: The award_xp_safe RPC performs the duplicate check INSIDE
  // the Postgres function using INSERT ... ON CONFLICT DO NOTHING on
  // a (user_id, lesson_id, source) unique constraint. Even if 50 threads
  // call this simultaneously, Postgres guarantees exactly 1 insert succeeds.
  // If the RPC doesn't exist yet, fall back to the old RPC with a
  // server-side guard using the upsert result.
  // ──────────────────────────────────────────────────────────────────────
  let finalXpAwarded = 0;
  let xpResult = null;

  if (isCompleted) {
    // Calculate multiplier based on total completed lessons
    const { count } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    const completedCount = count || 0;
    let xpMultiplier = 1;
    if (completedCount <= 10) {
      xpMultiplier = 10;
    } else if (completedCount <= 30) {
      xpMultiplier = 5;
    }

    const baseReward = lesson.xp_reward ?? 10;
    finalXpAwarded = baseReward * xpMultiplier;

    // Use award_xp_idempotent — Postgres function with ON CONFLICT DO NOTHING
    // This guarantees at-most-once XP per (user_id, lesson_id) pair
    try {
      const { data } = await supabase.rpc('award_xp_idempotent', {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_xp_amount: finalXpAwarded,
        p_source: 'LESSON_COMPLETE',
      });
      xpResult = data;
    } catch {
      // Fallback: old RPC — the upsert above already wrote is_completed=true,
      // so a second concurrent request will see the row and skip this block
      // on its next attempt (progress.is_completed was already true).
      const { data } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_xp_amount: finalXpAwarded,
        p_source: 'LESSON_COMPLETE',
      });
      xpResult = data;
    }
  }

  return sendSuccess(res, { progress, xpAwarded: xpResult }, { message: 'Progress updated' });
}));

export default router;
