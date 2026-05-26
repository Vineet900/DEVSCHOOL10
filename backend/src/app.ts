import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';

import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/requestId.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { AppError } from './utils/errors.js';

// ─── Route Imports ────────────────────────────────────────
import authRoutes from './api/v1/auth/auth.routes.js';
import userRoutes from './api/v1/users/users.routes.js';
import courseRoutes from './api/v1/courses/courses.routes.js';
import progressRoutes from './api/v1/progress/progress.routes.js';
import quizRoutes from './api/v1/quizzes/quizzes.routes.js';
import aiRoutes from './api/v1/ai/ai.routes.js';
import adminRoutes from './api/v1/admin/admin.routes.js';
import certificateRoutes from './api/v1/certificates/certificates.routes.js';
import uploadRoutes from './api/v1/uploads/uploads.routes.js';

const app = express();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── Request ID (Distributed Tracing) ─────────────────────
app.use(requestId);

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: [
    config.cors.origin,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Custom-Api-Key'],
}));

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ─── HTTP Parameter Pollution Prevention ──────────────────
app.use(hpp());

// ─── Request Logging ──────────────────────────────────────
app.use(morgan(
  config.isProd
    ? ':remote-addr ":method :url" :status :res[content-length] - :response-time ms'
    : 'dev',
  {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    // Don't log health checks
    skip: (req) => req.url === '/health',
  }
));

// ─── Global Rate Limiter (Safety Net) ─────────────────────
app.use(generalLimiter);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '2.0.0',
  });
});

// ─── API Routes (v1) ─────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// ─── Backward Compatibility (old routes → v1) ────────────
// Keep these for existing mobile app / frontend until migrated
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestIdValue = req.requestId || 'unknown';

  if (err instanceof AppError) {
    // Operational error — safe to send to client
    logger.warn(`[${err.code}] ${err.message}`, {
      requestId: requestIdValue,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId: requestIdValue,
    });
    return;
  }

  // Unknown error — log full stack, send generic message
  logger.error('Unhandled error', {
    requestId: requestIdValue,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: config.isProd ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    requestId: requestIdValue,
  });
});

export default app;
