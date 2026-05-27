import { Queue } from 'bullmq';
import { redisClient } from '../lib/redis.js';

export const aiFastQueueName = 'ai-fast-tasks';
export const aiSlowQueueName = 'ai-slow-tasks';

const commonJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // keep for 1 hour
    count: 1000,
  },
  removeOnFail: {
    age: 24 * 3600, // keep for 24 hours
  },
};

// Queue for fast jobs (e.g., generate-roadmap, quizzes)
export const aiFastQueue = new Queue(aiFastQueueName, {
  connection: redisClient as any,
  defaultJobOptions: commonJobOptions,
});

// Queue for slow jobs (e.g., enhance-lesson)
export const aiSlowQueue = new Queue(aiSlowQueueName, {
  connection: redisClient as any,
  defaultJobOptions: commonJobOptions,
});

export interface AITaskPayload {
  userId: string;
  type: 'generate-roadmap' | 'enhance-lesson' | 'chat';
  payload: any;
  customApiKey?: string;
}
