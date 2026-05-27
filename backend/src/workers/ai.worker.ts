import { Worker, Job } from 'bullmq';
import { redisClient } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { aiFastQueueName, aiSlowQueueName, AITaskPayload } from '../queues/ai.queue.js';
import { geminiService } from '../services/ai/gemini.service.js';
import { tokenService } from '../services/ai/token.service.js';
import { supabase } from '../lib/supabase.js';

// The processor function for AI jobs
const processAITask = async (job: Job<AITaskPayload>) => {
  logger.info(`[Worker] Processing job ${job.id} of type ${job.data.type}`);
  
  const { type, payload, userId, customApiKey } = job.data;
  let result = null;

  try {
    switch (type) {
      case 'generate-roadmap': {
        const { goal, currentLevel, timeframe, language } = payload;
        const prompt = `Create a detailed learning roadmap for: "${goal}"\nCurrent level: ${currentLevel}\nTimeframe: ${timeframe}\n\nReturn valid JSON:\n{\n  "title": "Roadmap Title",\n  "weeks": [{\n    "week": 1,\n    "topic": "Topic name",\n    "tasks": ["Task 1", "Task 2"],\n    "resources": ["Resource 1"]\n  }]\n}\n\nLanguage: ${language === 'hi' ? 'Hindi' : 'English'}.\nOnly return the JSON, no other text.`;
        
        const aiResult = await geminiService.generate({ prompt, customApiKey });
        const roadmap = geminiService.extractJson(aiResult.text);

        const { data: saved } = await supabase
          .from('user_roadmaps')
          .insert({ user_id: userId, title: goal, content: roadmap })
          .select()
          .single();

        result = { roadmap: saved, model: aiResult.model };
        break;
      }

      case 'enhance-lesson': {
        const { content, lessonId } = payload;
        
        const { data: lesson } = await supabase.from('lessons').select('title, course_id').eq('id', lessonId).single();
        const courseTitle = lesson?.course_id ? 'this course' : 'this course'; // simplified for worker

        const prompt = `You are a world-class educational content creator for DevSchool Pro.
Enhance the coding lesson named "${lesson?.title}" in the course "${courseTitle}".

Write an EXHAUSTIVE, deep, highly technical, and completely comprehensive textbook chapter for this lesson.
The content must be fully real, extremely educational, contain solid production code examples, and not use any placeholder text.

Return valid JSON matching the following structure:
{
  "title": "${lesson?.title}",
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

        const aiResult = await geminiService.generate({ prompt, customApiKey });
        const enhancedJson = geminiService.extractJson(aiResult.text);

        const { data: updated } = await supabase
          .from('lessons')
          .update({
            content: (enhancedJson as any).chapterOverview || content,
            lesson_data: enhancedJson,
          })
          .eq('id', lessonId)
          .select()
          .single();

        result = { lesson: updated, model: aiResult.model };
        break;
      }

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    logger.info(`[Worker] Job ${job.id} completed successfully.`);
    return result;

  } catch (error: any) {
    logger.error(`[Worker] Job ${job.id} failed: ${error.message}`);
    // If we wanted to refund the user's token, we would do it here.
    // However, BullMQ will retry the job. Refunding could cause token duplication on retries.
    // So we accept the token loss on permanent failure as a minor trade-off for exploit prevention.
    throw error;
  }
};

// Initialize the fast worker (high concurrency)
export const aiFastWorker = new Worker<AITaskPayload>(
  aiFastQueueName,
  processAITask,
  {
    connection: redisClient as any,
    concurrency: 10,
    lockDuration: 30000, 
  }
);

// Initialize the slow worker (low concurrency)
export const aiSlowWorker = new Worker<AITaskPayload>(
  aiSlowQueueName,
  processAITask,
  {
    connection: redisClient as any,
    concurrency: 2,
    lockDuration: 120000, 
  }
);

[aiFastWorker, aiSlowWorker].forEach((worker) => {
  worker.on('completed', (job: any) => {
    logger.debug(`[Worker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job: any, err: any) => {
    logger.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  worker.on('error', (err: any) => {
    logger.error(`[Worker] Redis connection error: ${err.message}`);
  });
});
