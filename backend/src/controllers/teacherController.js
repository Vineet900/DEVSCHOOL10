import axios from 'axios';
import { supabase } from '../database/supabase.js';
import { logger } from '../utils/logger.js';

// Utility to verify if user has tokens (only if using server key)
const checkTokenBalance = async (userId, customApiKey) => {
  if (customApiKey) return { canProceed: true };

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('ai_tokens')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      logger.error('Token check profile error: ' + (error?.message || 'Profile not found'));
      return { canProceed: false, status: 404, message: 'Student profile not found.' };
    }

    const tokens = profile.ai_tokens ?? 50;
    if (tokens <= 0) {
      return { 
        canProceed: false, 
        status: 402, 
        message: 'You have run out of AI Tutor tokens! Please enter your own Gemini API key in the AI Tutor panel or contact support to continue.' 
      };
    }
    return { canProceed: true, currentTokens: tokens };
  } catch (err) {
    logger.error('Token check exception: ' + err.message);
    return { canProceed: false, status: 500, message: 'Internal server error checking tokens.' };
  }
};

// Utility to deduct 1 token from user profile (only if using server key)
const deductToken = async (userId, customApiKey) => {
  if (customApiKey) return;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_tokens')
      .eq('user_id', userId)
      .single();

    if (profile) {
      const current = profile.ai_tokens ?? 50;
      const next = Math.max(0, current - 1);
      const { error } = await supabase
        .from('profiles')
        .update({ ai_tokens: next })
        .eq('user_id', userId);
      
      if (error) {
        logger.error('Failed to deduct token from profile: ' + error.message);
      } else {
        logger.info(`Successfully deducted AI token. Remaining for user ${userId}: ${next}`);
      }
    }
  } catch (err) {
    logger.error('Token deduction exception: ' + err.message);
  }
};

// Helper to call Gemini API
// Returns { text, tokensUsed }
const callGemini = async (prompt, systemInstruction = '', modelOverride = null, customApiKey = null) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in backend environment variables.');
  }

  // Model priority: caller override > env var > default
  const model = modelOverride || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  let response;
  try {
    response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
  } catch (err) {
    if (err.response) {
      logger.error('Gemini API Error Response: ' + JSON.stringify(err.response.data));
      err.status = err.response.status;
      err.apiErrorData = err.response.data;
    }
    throw err;
  }

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid response format received from Gemini API.');
  }

  const tokensUsed = response.data?.usageMetadata?.totalTokenCount ?? 0;

  return { text: text.trim(), tokensUsed };
};


// Robust JSON extraction helper
const extractJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    // Look for JSON block wrapped in ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerErr) {
        // Fallback to bracket search
      }
    }

    // Try finding the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.substring(start, end + 1);
      try {
        return JSON.parse(candidate.trim());
      } catch (innerErr) {
        // Fallback failed
      }
    }
    throw new Error('Failed to parse JSON response from Gemini: ' + err.message);
  }
};

// Helper to fetch user details from database for contextual learning
const fetchUserContext = async (userId) => {
  if (!userId) return null;
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) return null;

    // Get enrolled courses
    let enrolledCourses = [];
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .or(`userId.eq.${userId},userid.eq.${userId}`);

      if (enrollments && enrollments.length > 0) {
        const enrolledCourseIds = enrollments.map(e => e.courseId || e.courseid || e.course_id).filter(Boolean);
        if (enrolledCourseIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('title')
            .in('id', enrolledCourseIds);
          if (coursesData) {
            enrolledCourses = coursesData.map(c => c.title);
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch enrollments for user context:', err.message || err);
    }

    // Get completed lessons from user_progress
    let completedLessons = [];
    let completedChaptersCount = 0;
    try {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true);

      if (progressData && progressData.length > 0) {
        completedChaptersCount = progressData.length;
        const completedLessonIds = progressData.map(p => p.lesson_id);
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('title')
          .in('id', completedLessonIds);
        if (lessonsData) {
          completedLessons = lessonsData.map(l => l.title);
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch progress for user context:', err.message || err);
    }

    // Get weak topics by querying failed quiz attempts (score < 70)
    const weakTopics = [];
    let quizAverage = 0;
    try {
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score, quiz_id')
        .eq('user_id', userId);

      if (quizAttempts && quizAttempts.length > 0) {
        const totalScore = quizAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0);
        quizAverage = Math.round(totalScore / quizAttempts.length);

        const failedQuizIds = [...new Set(quizAttempts.filter(a => a.score < 70).map(a => a.quiz_id))];
        if (failedQuizIds.length > 0) {
          const { data: quizzes } = await supabase
            .from('quizzes')
            .select('title')
            .in('id', failedQuizIds);
          if (quizzes) {
            quizzes.forEach(q => weakTopics.push(q.title));
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch quiz attempts for user context:', err.message || err);
    }

    // Get custom roadmaps for roadmap progress
    let roadmapsInfo = 'None yet';
    try {
      const { data: roadmaps } = await supabase
        .from('user_roadmaps')
        .select('title, steps')
        .eq('user_id', userId);

      if (roadmaps && roadmaps.length > 0) {
        roadmapsInfo = roadmaps.map(r => {
          const totalSteps = Array.isArray(r.steps) ? r.steps.length : 0;
          return `${r.title} (${totalSteps} steps)`;
        }).join(', ');
      }
    } catch (err) {
      logger.warn('Failed to fetch roadmaps for user context:', err.message || err);
    }

    return {
      name: profile.full_name || profile.name || profile.username || 'Student',
      xp: profile.xp || 0,
      studyPoints: profile.study_points || 0,
      completedChaptersCount,
      completedLessons,
      enrolledCourses,
      quizAverage,
      quizScores: profile.quiz_scores || {},
      weakTopics: weakTopics.length > 0 ? weakTopics : ['None identified yet'],
      roadmapsInfo
    };
  } catch (err) {
    logger.warn('Failed to fetch user context for teacher:', err.message || err);
    return null;
  }
};

/**
 * @desc    POST /api/teacher - Ask AI Teacher/Tutor
 */
export const askTeacher = async (req, res, next) => {
  try {
    const { message, course, level, userId, model } = req.body;
    const targetUserId = userId || req.user?.id;
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message field is required.' });
    }

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const context = await fetchUserContext(targetUserId);
    
    const systemPrompt = `You are DevSensei — a warm, encouraging, and highly knowledgeable AI coding teacher on the DevSchool Pro platform.

Your teaching style:
- Speak like a friendly, patient mentor (not a robot). Use "you" directly.
- Always explain with real-world analogies and simple examples first, then go deeper.
- When a student makes a mistake, correct gently and explain why.
- Break complex concepts into small digestible steps.
- Celebrate student progress and encourage them when they struggle.
- Use code examples in markdown code blocks.
- If asked to create a quiz, format it clearly with options and explanations.
- Keep responses concise but complete — avoid information overload.
- End responses with a follow-up question or suggestion to keep learning momentum.

Student Profile:
- Name: ${context?.name || 'Student'}
- Skill Level: ${level || 'Beginner'}
- Active Course: ${course || 'Web Development'}
- Enrolled Courses: ${context?.enrolledCourses?.join(', ') || 'None yet'}
- Study Points: ${context?.studyPoints || 0}
- Completed Lessons: ${context?.completedLessons?.join(', ') || 'None yet'}
- Quiz Average: ${context?.quizAverage || 0}%
- Weak Topics: ${context?.weakTopics?.join(', ') || 'None identified yet'}
- Quiz Scores: ${context ? JSON.stringify(context.quizScores) : '{}'}
- Custom Roadmaps: ${context?.roadmapsInfo || 'None yet'}

Always remember: You are DevSensei. Never refer to yourself as Gemini, Google, or any other AI brand.
`;

    const { text: answer, tokensUsed } = await callGemini(message, systemPrompt, model, customApiKey);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      answer,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('Teacher API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error in teacher endpoint.';
    res.status(status).json({ success: false, message: msg });
  }
};

/**
 * @desc    POST /api/generateQuiz - Generate a mini quiz
 */
export const generateQuiz = async (req, res, next) => {
  try {
    const { course, level, userId, topic, model } = req.body;
    const targetUserId = userId || req.user?.id;
    const context = await fetchUserContext(targetUserId);
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const prompt = `Generate a personalized multiple-choice coding quiz for a student learning ${course || 'Web Development'} at a ${level || 'Beginner'} level.
${topic ? `Focus specifically on the topic: ${topic}.` : ''}
${context?.weakTopics && context.weakTopics[0] !== 'None identified yet' ? `Pay extra attention to their identified weak areas: ${context.weakTopics.join(', ')}.` : ''}

You MUST return ONLY a JSON object. Do not include markdown code blocks. The JSON schema must match:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Explanation of why the option at answerIndex is correct."
    }
  ]
}
Generate exactly 3 high-quality questions.`;

    const { text: responseText, tokensUsed } = await callGemini(prompt, 'You are a quiz generation engine that outputs ONLY raw JSON matching the requested schema.', model, customApiKey);
    const quiz = extractJson(responseText);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      quiz,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('generateQuiz API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error generating quiz.';
    res.status(status).json({ success: false, message: msg });
  }
};

/**
 * @desc    POST /api/generateRoadmap - Generate custom learning roadmap
 */
export const generateRoadmap = async (req, res, next) => {
  try {
    const { title, level, userId, model } = req.body;
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;
    const targetUserId = userId || req.user?.id;

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const prompt = `Generate a customized learning roadmap/path for: "${title || 'Full Stack Web Development'}" at a "${level || 'Beginner'}" level.
    
You MUST return ONLY a JSON object. Do not include markdown code blocks. The JSON schema must match:
{
  "title": "Roadmap Title",
  "description": "Overview of this custom roadmap",
  "steps": [
    {
      "title": "Step Title",
      "description": "Details about what to learn in this step",
      "xp": 100
    }
  ]
}
Generate exactly 4-6 sequential steps.`;

    const { text: responseText, tokensUsed } = await callGemini(prompt, 'You are a roadmap generation engine that outputs ONLY raw JSON matching the requested schema.', model, customApiKey);
    const roadmap = extractJson(responseText);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      roadmap,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('generateRoadmap API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error generating roadmap.';
    res.status(status).json({ success: false, message: msg });
  }
};

/**
 * @desc    POST /api/explainCode - Explain code step-by-step
 */
export const explainCode = async (req, res, next) => {
  try {
    const { code, language, level, userId, model } = req.body;
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;
    const targetUserId = userId || req.user?.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code field is required.' });
    }

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const prompt = `Please explain the following ${language || 'programming language'} code snippet step-by-step for a student at a ${level || 'Beginner'} level:

\`\`\`
${code}
\`\`\`

Break down the explanation into clear sections, describe what each part does, and suggest a simple modification or experiment they can try.`;

    const { text: explanation, tokensUsed } = await callGemini(prompt, 'You are an expert programming tutor that explains code clearly and concisely.', model, customApiKey);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      answer: explanation,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('explainCode API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error explaining code.';
    res.status(status).json({ success: false, message: msg });
  }
};

/**
 * @desc    POST /api/dailyStudyPlan - Generate customized daily study plan
 */
export const dailyStudyPlan = async (req, res, next) => {
  try {
    const { course, level, userId, model } = req.body;
    const targetUserId = userId || req.user?.id;
    const context = await fetchUserContext(targetUserId);
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const prompt = `Create a daily study plan for a student learning ${course || 'Web Development'} at a ${level || 'Beginner'} level.
    
Context:
- Streak: ${context?.completedChaptersCount || 0} milestones done
- Weak Topics: ${context?.weakTopics?.join(', ') || 'None identified yet'}

Break the daily study plan into 3 sections:
1. Core concept to study (15 mins)
2. Practical Coding Challenge (20 mins)
3. Micro self-assessment question`;

    const { text: studyPlan, tokensUsed } = await callGemini(prompt, 'You are an educational planner that creates structured, daily micro-learning schedules.', model, customApiKey);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      answer: studyPlan,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('dailyStudyPlan API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error generating daily study plan.';
    res.status(status).json({ success: false, message: msg });
  }
};

/**
 * @desc    POST /api/studySummary - Retrieve progress summary
 */
export const studySummary = async (req, res, next) => {
  try {
    const { userId, model } = req.body;
    const targetUserId = userId || req.user?.id;
    const context = await fetchUserContext(targetUserId);
    const customApiKey = req.headers['x-custom-api-key'] || req.body?.customApiKey;

    if (!context) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Check token balance
    const tokenCheck = await checkTokenBalance(targetUserId, customApiKey);
    if (!tokenCheck.canProceed) {
      return res.status(tokenCheck.status).json({ success: false, message: tokenCheck.message });
    }

    const prompt = `Review the student progress data below and provide a concise, encouraging study summary. Point out their strengths, identify the core areas they need to focus on next, and write 3 concrete recommendations.
    
Student Profile:
- Name: ${context.name}
- XP: ${context.xp}
- Completed Lessons: ${context.completedChaptersCount}
- Enrolled Courses: ${context.enrolledCourses.join(', ')}
- Quiz Average: ${context.quizAverage}%
- Quiz Scores: ${JSON.stringify(context.quizScores)}
- Weak Topics: ${context.weakTopics.join(', ')}`;

    const { text: summary, tokensUsed } = await callGemini(prompt, 'You are an academic coach that reviews student metrics and gives actionable study guidance.', model, customApiKey);

    await deductToken(targetUserId, customApiKey);

    res.status(200).json({
      success: true,
      answer: summary,
      tokensUsed,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  } catch (err) {
    logger.error('studySummary API exception:', err);
    const status = err.status || 500;
    const msg = err.apiErrorData?.error?.message || err.message || 'Internal server error generating study summary.';
    res.status(status).json({ success: false, message: msg });
  }
};
