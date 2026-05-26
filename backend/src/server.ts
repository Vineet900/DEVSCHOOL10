import app from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 DevSchool Pro API running on port ${PORT} [${config.env}]`);
  logger.info(`📋 Health check: http://localhost:${PORT}/health`);
  logger.info(`📡 API Base: http://localhost:${PORT}/api/v1`);
});

// ─── Graceful Shutdown ────────────────────────────────────
// AWS ECS / Docker sends SIGTERM before killing the container.
// We stop accepting new connections and let in-flight requests finish.

const shutdown = (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('✅ All connections closed. Server stopped.');
    process.exit(0);
  });

  // Force kill if still alive after 30 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Error Handlers ─────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION:', { reason });
  // Don't crash — let the health check detect issues
});

process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION:', { error: error.message, stack: error.stack });
  // This is serious — exit and let Docker restart the container
  process.exit(1);
});
