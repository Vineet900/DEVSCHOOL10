import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { aiLimiter } from '../../../middleware/rateLimiter.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { askTeacherSchema, generateQuizSchema, generateRoadmapSchema } from '../../../validators/ai.validator.js';
import { tokenService } from '../../../services/ai/token.service.js';
import { geminiService } from '../../../services/ai/gemini.service.js';
import { InsufficientTokensError } from '../../../utils/errors.js';
import { supabase } from '../../../lib/supabase.js';

const router = Router();

// All AI routes require authentication + rate limiting
router.use(protect);
router.use(aiLimiter);

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

  if (!bypassTokens) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) throw new InsufficientTokensError();
  }

  const prompt = `Create a detailed learning roadmap for: "${goal}"
Current level: ${currentLevel}
Timeframe: ${timeframe}

Return valid JSON:
{
  "title": "Roadmap Title",
  "weeks": [{
    "week": 1,
    "topic": "Topic name",
    "tasks": ["Task 1", "Task 2"],
    "resources": ["Resource 1"]
  }]
}

Language: ${language === 'hi' ? 'Hindi' : 'English'}.
Only return the JSON, no other text.`;

  const result = await geminiService.generate({ prompt, customApiKey });
  const roadmap = geminiService.extractJson(result.text);

  // Save roadmap to DB
  const { data: saved } = await supabase
    .from('user_roadmaps')
    .insert({
      user_id: userId,
      title: goal,
      content: roadmap,
    })
    .select()
    .single();

  return sendSuccess(res, { roadmap: saved, model: result.model }, { statusCode: 201 });
}));

// ─── GET /api/v1/ai/tokens — Get token balance ───────────
router.get('/tokens', asyncHandler(async (req, res) => {
  const balance = await tokenService.getBalance(req.user.id);
  return sendSuccess(res, { ai_tokens: balance ?? 0 });
}));

// ─── POST /api/v1/ai/enhance-lesson — AI Lesson Enhancer ───
router.post('/enhance-lesson', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { lessonId } = req.body;

  if (!lessonId) {
    return sendError(res, 'Lesson ID is required', 400);
  }

  const customApiKey = req.headers['x-custom-api-key'] as string | undefined;
  const bypassTokens = !!customApiKey;

  if (!bypassTokens) {
    const tokenResult = await tokenService.deductToken(userId);
    if (!tokenResult.success) throw new InsufficientTokensError();
  }

  // Fetch current lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonErr || !lesson) {
    return sendError(res, 'Lesson not found', 404);
  }

  // Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', lesson.course_id)
    .maybeSingle();

  const courseTitle = course?.title || 'this course';

  const prompt = `You are a world-class educational content creator for DevSchool Pro.
Enhance the coding lesson named "${lesson.title}" in the course "${courseTitle}".

Write an EXHAUSTIVE, deep, highly technical, and completely comprehensive textbook chapter for this lesson.
The content must be fully real, extremely educational, contain solid production code examples, and not use any placeholder text.

Return valid JSON matching the following structure:
{
  "title": "${lesson.title}",
  "chapterOverview": "A thorough, high-level overview explaining what this chapter is about.",
  "whyThisMatters": "A powerful explanation of why this topic is essential for software engineers.",
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "theory": [
    {
      "topic": "First Core Concept",
      "deepExplanation": "Exhaustively detailed explanation of this topic with professional and deep technical analysis.",
      "beginnerAnalogy": "A simple, friendly, and memorable analogy explaining this concept to beginners.",
      "realWorldUsage": "How this concept is applied in production applications.",
      "industryUsage": "Specific systems, companies, or tools that rely on this concept.",
      "bestPractices": ["Best practice 1", "Best practice 2"],
      "commonMistakes": ["Common mistake 1", "Common mistake 2"],
      "optimizationTips": ["Performance tip 1"],
      "securityTips": ["Security tip 1"],
      "architectureNotes": ["System architecture design note"]
    }
  ],
  "examples": [
    {
      "title": "Production-Ready Implementation",
      "code": "Write full, real, working code (JavaScript, Python, SQL, etc., matching the tech of the course). Avoid short dummy examples.",
      "expectedOutput": "Show the exact execution console output.",
      "lineByLineExplanation": ["Line 1 explanation", "Line 2 explanation"],
      "realWorldExplanation": "Explain how this code functions in a real-world enterprise system."
    }
  ],
  "miniProjects": [
    {
      "title": "Interactive Builder Project",
      "description": "A clear, actionable prompt to build a small real-world tool using these concepts.",
      "features": ["Feature 1", "Feature 2", "Feature 3"]
    }
  ],
  "practiceProblems": {
    "easy": ["Challenge 1", "Challenge 2"],
    "medium": ["Challenge 3", "Challenge 4"],
    "hard": ["Challenge 5"]
  },
  "revisionNotes": ["Revision note 1", "Revision note 2"],
  "chapterSummary": "A powerful concluding summary for the chapter."
}

Return ONLY the JSON. Do not write any other text or markdown code blocks outside of the JSON. Make sure the JSON is perfectly valid and all double-quotes are escaped correctly inside strings.`;

  const result = await geminiService.generate({ prompt, customApiKey });
  const enhancedJson = geminiService.extractJson(result.text);

  // Update in database
  const { data: updated, error: updateErr } = await supabase
    .from('lessons')
    .update({
      content: (enhancedJson as any).chapterOverview || lesson.content,
      lesson_data: enhancedJson,
    })
    .eq('id', lessonId)
    .select()
    .single();

  if (updateErr || !updated) {
    return sendError(res, 'Failed to update lesson content in database', 500);
  }

  return sendSuccess(res, { lesson: updated, model: result.model });
}));

export default router;
