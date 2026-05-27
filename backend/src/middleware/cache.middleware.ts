import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import { redisClient } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

// Fallback in-memory cache to prevent Thundering Herd if Redis dies
const fallbackCache = new LRUCache<string, string>({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
});

/**
 * Cache middleware using Redis with LRU fallback.
 * Intercepts res.json to cache the response body.
 *
 * @param ttl Time to live in seconds
 * @param prefix Prefix for the cache key
 */
export const cacheResponse = (ttl: number = 300, prefix: string = 'api') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // FIX #2: Cache Key Space Exhaustion
    // Strip query parameters to prevent attackers from spamming infinite unique keys
    // e.g. /api/v1/courses?attack=123 becomes cache:courses:/api/v1/courses
    const key = `cache:${prefix}:${req.baseUrl}${req.path}`;

    try {
      let cachedData: string | null = null;
      
      try {
        if (redisClient.status === 'ready') {
          cachedData = await redisClient.get(key);
        } else {
          throw new Error('Redis not ready');
        }
      } catch (redisErr) {
        // Fallback to LRU Cache if Redis is unreachable
        cachedData = fallbackCache.get(key) || null;
      }

      if (cachedData) {
        logger.debug(`[Cache] HIT: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedData));
      }

      logger.debug(`[Cache] MISS: ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Intercept res.json to cache the output before sending
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const bodyStr = JSON.stringify(body);
          
          // Save to LRU fallback first
          fallbackCache.set(key, bodyStr, { ttl: ttl * 1000 });
          
          // Attempt to save to Redis
          if (redisClient.status === 'ready') {
            redisClient.setex(key, ttl, bodyStr).catch((err: any) => {
              logger.error(`[Cache] Failed to save key ${key}:`, err);
            });
          }
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`[Cache] Unexpected error for key ${key}:`, error);
      next();
    }
  };
};

/**
 * Helper to invalidate cache by prefix
 */
export const invalidateCache = async (prefix: string) => {
  try {
    // Invalidate LRU
    const lruKeys = Array.from(fallbackCache.keys());
    lruKeys.forEach((k) => {
      if (k.startsWith(`cache:${prefix}:`)) fallbackCache.delete(k);
    });

    // Invalidate Redis
    if (redisClient.status === 'ready') {
      const keys = await redisClient.keys(`cache:${prefix}:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`[Cache] Invalidated ${keys.length} keys for prefix ${prefix}`);
      }
    }
  } catch (error) {
    logger.error(`[Cache] Failed to invalidate prefix ${prefix}:`, error);
  }
};
