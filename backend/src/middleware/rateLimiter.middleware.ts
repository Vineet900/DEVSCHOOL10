import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { Request, Response } from 'express';
import { redisClient } from '../lib/redis.js';

// ─── Rate Limiter Configurations ──────────────────────────────────────────────
// Uses express-rate-limit v7 with RedisStore for multi-instance deployments.

const getRedisStore = (prefix: string) => new RedisStore({
  // @ts-expect-error - rate-limit-redis types mismatch slightly with ioredis
  sendCommand: (...args: string[]) => redisClient.call(...args),
  prefix: `rl:${prefix}:`,
});

const rateLimitResponse = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  });
};

// ─── Auth Rate Limiters ───────────────────────────────────────────────────────

/** Login: 10 attempts per 15 minutes per IP — brute force protection */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: getRedisStore('login'),
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/** Register: 5 registrations per hour per IP — spam prevention */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: getRedisStore('register'),
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/** OTP Verify: 10 attempts per 15 min per IP — OTP brute force protection */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: getRedisStore('otp'),
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── AI Rate Limiters ─────────────────────────────────────────────────────────

/** AI endpoints: 30 requests per minute per authenticated user */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  store: getRedisStore('ai'),
  // Key by user ID (from JWT) — not IP (VPN bypass protection)
  // Falls back to IP if user not set
  keyGenerator: (req) => req.user?.id ?? req.socket.remoteAddress ?? 'unknown',
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.user,
});

// ─── Progress / Quiz Rate Limiters ────────────────────────────────────────────

/** Quiz submission: 5 per quiz per 5 min — prevent rapid-fire cheating */
export const quizSubmitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  store: getRedisStore('quiz'),
  keyGenerator: (req) =>
    `${req.user?.id ?? req.socket.remoteAddress ?? 'unknown'}:quiz:${req.params['id'] ?? 'unknown'}`,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Progress updates: 60 per minute per user */
export const progressLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: getRedisStore('progress'),
  keyGenerator: (req) => req.user?.id ?? req.socket.remoteAddress ?? 'unknown',
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Redeem requests: 5 per hour per user — anti-spam */
export const redeemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: getRedisStore('redeem'),
  keyGenerator: (req) => req.user?.id ?? req.socket.remoteAddress ?? 'unknown',
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API: 200 requests per minute per IP — global safety net */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  store: getRedisStore('general'),
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
