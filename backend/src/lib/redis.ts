import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// Connection details
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  // Retry strategy for resilient connections
  retryStrategy: (times: number) => {
    if (times > 10) {
      logger.error('[Redis] Max retries reached, giving up.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 500, 5000);
    logger.warn(`[Redis] Connection lost. Retrying in ${delay}ms... (Attempt ${times}/10)`);
    return delay;
  },
  // Keep alive config
  enableReadyCheck: true,
  keepAlive: 10000,
};

// Singleton pattern for Redis connection
class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      logger.info(`[Redis] Initializing connection to ${redisConfig.host}:${redisConfig.port}`);
      RedisClient.instance = new Redis(redisConfig);

      RedisClient.instance.on('connect', () => {
        logger.info('[Redis] Connection established successfully.');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('[Redis] Client is ready to receive commands.');
      });

      RedisClient.instance.on('error', (err) => {
        logger.error(`[Redis] Connection error: ${err.message}`);
      });

      RedisClient.instance.on('close', () => {
        logger.warn('[Redis] Connection closed.');
      });
    }

    return RedisClient.instance;
  }

  /**
   * Graceful shutdown function to close Redis connection safely
   */
  public static async quit(): Promise<void> {
    if (RedisClient.instance) {
      logger.info('[Redis] Closing connection...');
      await RedisClient.instance.quit();
      logger.info('[Redis] Connection closed gracefully.');
    }
  }
}

export const redisClient = RedisClient.getInstance();
