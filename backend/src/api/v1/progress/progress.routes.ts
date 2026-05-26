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
// XP is awarded SERVER-SIDE via atomic RPC — never from client
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

  // Check if progress already exists for this lesson to prevent repeat XP exploitation
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const alreadyCompleted = existingProgress?.is_completed === true;

  // Upsert progress
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

  // Dynamic Multiplier Logic (Gamification hook)
  // Give high points at the start, then gradually decrease
  let xpMultiplier = 1;
  let finalXpAwarded = 0;
  let xpResult = null;

  // Only award XP if the lesson is marked complete and was NOT already completed before
  if (isCompleted && !alreadyCompleted) {
    // Check how many lessons the user has completed so far
    const { count } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    const completedCount = count || 0;

    if (completedCount <= 10) {
      xpMultiplier = 10; // 10x for first 10 lessons
    } else if (completedCount <= 30) {
      xpMultiplier = 5;  // 5x for next 20 lessons
    }

    const baseReward = lesson.xp_reward ?? 10;
    finalXpAwarded = baseReward * xpMultiplier;

    const { data } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_xp_amount: finalXpAwarded,
      p_source: 'LESSON_COMPLETE',
    });
    xpResult = data;
  }

  return sendSuccess(res, { progress, xpAwarded: xpResult }, { message: 'Progress updated' });
}));

export default router;
