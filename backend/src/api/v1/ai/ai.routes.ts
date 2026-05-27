import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { authorize } from '../../../middleware/rbac.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { aiLimiter } from '../../../middleware/rateLimiter.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { askTeacherSchema, generateQuizSchema, generateRoadmapSchema } from '../../../validators/ai.validator.js';
import { tokenService } from '../../../services/ai/token.service.js';
import { geminiService } from '../../../services/ai/gemini.service.js';
import { InsufficientTokensError, ForbiddenError } from '../../../utils/errors.js';
import { supabase } from '../../../lib/supabase.js';
import { logger } from '../../../lib/logger.js';
import { aiFastQueue, aiSlowQueue } from '../../../queues/ai.queue.js';

const router = Router();

// All AI routes require authentication + rate limiting
router.use(protect);
router.use(aiLimiter);

// ─── SECURITY: Strip x-custom-api-key for non-admin users ──────────────────
// Prevents header spoofing: only ADMIN users may supply their own API key
// to bypass token deduction. Regular students ALWAYS consume tokens.
router.use((req, _res, next) => {
  if (req.user?.role !== 'ADMIN' && req.headers['x-custom-api-key']) {
    logger.warn('[AI] Non-admin tried to use x-custom-api-key header', {
      userId: req.user?.id,
      requestId: req.requestId,
    });
    delete req.headers['x-custom-api-key'];
  }
  next();
});

// ─── POST /api/v1/ai/chat — AI Teacher ───────────────────
// FIX #5: userId ALWAYS from JWT (no IDOR)
// FIX #6: customApiKey ONLY from header (no body exposure)
router.post('/chat', validate(askTeacherSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← FIX #5: NEVER from body
  const { question, courseId, lessonId, language, chatHistory } = req.body;

  // FIX #6: Custom API key ONLY from header — never logged
  const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
  const bypassTokens = !!customApiKey;

  // FIX #1: Atomic token deduction — no race condition
  if (!bypassTokens) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) {
      throw new InsufficientTokensError();
    }
  }

  // Build context-aware prompt
  let contextInfo = '';
  if (courseId) {
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle();
    if (course) contextInfo += `Currently studying: ${course.title}. `;
  }
  if (lessonId) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', lessonId)
      .maybeSingle();
    if (lesson) contextInfo += `Current lesson: ${lesson.title}. `;
  }

  const systemInstruction = `You are an expert coding tutor for DevSchool Pro.
${contextInfo}
Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
Keep answers concise, practical, and include code examples when relevant.
The student's level: ${req.user.profile?.level ?? 1}.`;

  // Build full prompt with chat history
  let fullPrompt = question;
  if (chatHistory && chatHistory.length > 0) {
    const historyText = chatHistory
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n');
    fullPrompt = `Previous conversation:\n${historyText}\n\nNew question: ${question}`;
  }

  const result = await geminiService.generate({
    prompt: fullPrompt,
    systemInstruction,
    customApiKey,
  });

  return sendSuccess(res, {
    answer: result.text,
    tokensUsed: result.tokensUsed,
    model: result.model,
  });
}));

// ─── POST /api/v1/ai/generate-quiz ───────────────────────
router.post('/generate-quiz', validate(generateQuizSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, difficulty, count, language } = req.body;

  const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
  const bypassTokens = !!customApiKey;

  if (!bypassTokens) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) throw new InsufficientTokensError();
  }

  const prompt = `Generate exactly ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

Return valid JSON array:
[{
  "question": "Question text",
  "options": ["A", "B", "C", "D"],
  "answer_index": 0,
  "explanation": "Why this is correct"
}]

Language: ${language === 'hi' ? 'Hindi' : 'English'}.
Only return the JSON array, no other text.`;

  const result = await geminiService.generate({ prompt, customApiKey });
  const questions = geminiService.extractJson<unknown[]>(result.text);

  return sendSuccess(res, { questions, model: result.model });
}));

// ─── POST /api/v1/ai/generate-roadmap ────────────────────
router.post('/generate-roadmap', validate(generateRoadmapSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { goal, currentLevel, timeframe, language } = req.body;

  const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
  const bypassTokens = !!customApiKey;

  // FIX: Deduct tokens synchronously before enqueuing to prevent race conditions
  if (!bypassTokens) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) throw new InsufficientTokensError();
  }

  // Enqueue job to FAST queue
  const job = await aiFastQueue.add('generate-roadmap', {
    userId,
    type: 'generate-roadmap',
    payload: { goal, currentLevel, timeframe, language },
    customApiKey,
  });

  return sendSuccess(res, { jobId: job.id, message: 'Roadmap generation started' }, { statusCode: 202 });
}));

// ─── GET /api/v1/ai/tokens — Get token balance ───────────
router.get('/tokens', asyncHandler(async (req, res) => {
  const balance = await tokenService.getBalance(req.user.id);
  return sendSuccess(res, { ai_tokens: balance ?? 0 });
}));

// ─── POST /api/v1/ai/enhance-lesson — AI Lesson Enhancer ───
// SECURITY FIX: ADMIN ONLY — students must never overwrite course content
router.post('/enhance-lesson', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { lessonId } = req.body;

  if (!lessonId) {
    return sendError(res, 'Lesson ID is required', { statusCode: 400 });
  }

  const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
  
  // Fetch current lesson to ensure it exists
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonErr || !lesson) {
    return sendError(res, 'Lesson not found', { statusCode: 404 });
  }

  // FIX: Deduct tokens synchronously before enqueuing
  if (!customApiKey) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) throw new InsufficientTokensError();
  }

  // Enqueue job to SLOW queue
  const job = await aiSlowQueue.add('enhance-lesson', {
    userId,
    type: 'enhance-lesson',
    payload: { content: lesson.content, level: 1, lessonId }, // pass necessary data
    customApiKey,
  });

  return sendSuccess(res, { jobId: job.id, message: 'Lesson enhancement started' }, { statusCode: 202 });
}));

// ─── GET /api/v1/ai/jobs/:jobId — Check Job Status ─────────
router.get('/jobs/:jobId', asyncHandler(async (req, res) => {
  const jobId = req.params.jobId as string;
  let job = await aiFastQueue.getJob(jobId);
  
  if (!job) {
    job = await aiSlowQueue.getJob(jobId);
  }

  if (!job) {
    return sendError(res, 'Job not found', { statusCode: 404 });
  }

  const state = await job.getState();
  const result = job.returnvalue;
  const error = job.failedReason;

  return sendSuccess(res, {
    id: job.id,
    state,
    result: state === 'completed' ? result : null,
    error: state === 'failed' ? error : null,
  });
}));

export default router;
