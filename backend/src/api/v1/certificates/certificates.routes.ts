import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import { supabase } from '../../../lib/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── POST /api/v1/certificates/generate/:courseId ─────────
router.post('/generate/:courseId', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const courseId = req.params['courseId']!;

  // Verify all lessons completed
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  const lessonIds = lessons?.map(l => l.id) ?? [];

  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']);

  const completedIds = new Set(progress?.map(p => p.lesson_id));
  const allCompleted = lessonIds.every(id => completedIds.has(id));

  if (!allCompleted) {
    return sendSuccess(res, null, { statusCode: 403, message: 'Course not yet completed' });
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return sendSuccess(res, existing);

  const verificationCode = `DS-${uuidv4().split('-')[0]!.toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const { data: cert, error } = await supabase
    .from('certificates')
    .insert({ user_id: userId, course_id: courseId, verification_code: verificationCode })
    .select().single();

  if (error) throw error;
  return sendSuccess(res, cert, { statusCode: 201, message: 'Certificate generated' });
}));

// ─── GET /api/v1/certificates/verify/:code ────────────────
router.get('/verify/:code', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('verification_code', req.params['code']!)
    .maybeSingle();

  if (error || !data) throw new NotFoundError('Certificate');
  return sendSuccess(res, data);
}));

export default router;
