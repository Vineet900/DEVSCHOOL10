import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { quizSubmitLimiter } from '../../../middleware/rateLimiter.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { submitQuizSchema } from '../../../validators/course.validator.js';
import { supabase } from '../../../lib/supabase.js';
import { NotFoundError, ValidationError } from '../../../utils/errors.js';

const router = Router();

// ─── GET /api/v1/quizzes/:id — Get quiz (WITHOUT answers) ─
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select('id, title, xp_reward, lesson_id, course_id, questions')
    .eq('id', req.params['id']!)
    .maybeSingle();

  if (error || !quiz) throw new NotFoundError('Quiz');

  // SECURITY: Strip answer_index from questions before sending
  const safeQuestions = (quiz.questions as Array<Record<string, unknown>>).map(q => ({
    question: q['question'],
    options: q['options'],
    explanation: q['explanation'],
    // answer_index is NOT included — server-side only
  }));

  return sendSuccess(res, { ...quiz, questions: safeQuestions });
}));

// ─── POST /api/v1/quizzes/:id/submit — Submit quiz ───────
// Score is calculated SERVER-SIDE — client only sends answer indexes
router.post('/:id/submit', protect, quizSubmitLimiter, validate(submitQuizSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← from JWT
  const quizId = req.params['id']!;
  const { answers } = req.body as { answers: number[] };

  // Fetch quiz with correct answers
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, questions, xp_reward')
    .eq('id', quizId)
    .maybeSingle();

  if (!quiz) throw new NotFoundError('Quiz');

  const questions = quiz.questions as Array<{ answer_index: number }>;

  // Validate answer count matches question count
  if (answers.length !== questions.length) {
    throw new ValidationError(
      `Expected ${questions.length} answers, got ${answers.length}`
    );
  }

  // SERVER-SIDE score calculation — never trust client
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.answer_index) correctCount++;
  });

  const score = Math.round((correctCount / questions.length) * 100);

  // Save attempt
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_id: quizId,
      score,
      answers,
      attempted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Award XP for passing (score >= 70%)
  let xpResult = null;
  if (score >= 70) {
    const { data } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_xp_amount: quiz.xp_reward ?? 20,
      p_source: 'QUIZ_PASS',
    });
    xpResult = data;
  }

  return sendSuccess(res, {
    attempt,
    score,
    correctCount,
    totalQuestions: questions.length,
    passed: score >= 70,
    xpAwarded: xpResult,
  }, { message: `Quiz completed with ${score}%` });
}));

// ─── GET /api/v1/quizzes/:id/results — User's attempts ───
router.get('/:id/results', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, score, attempted_at')
    .eq('user_id', req.user.id)
    .eq('quiz_id', req.params['id']!)
    .order('attempted_at', { ascending: false })
    .limit(10); // Paginated — latest 10 attempts

  if (error) throw error;
  return sendSuccess(res, data);
}));

export default router;
