import winston from 'winston';
import { config } from '../config/index.js';

// ─── Structured Logger ────────────────────────────────────────────────────────
// Uses JSON format in production (CloudWatch/Datadog compatible).
// Human-readable colorized format in development.
// File transports are intentionally removed for production — use
// log aggregation (CloudWatch, Datadog, Loki) instead of ephemeral files.

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, requestId, ...meta }) => {
    const rid = requestId ? ` [${String(requestId)}]` : '';
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${String(timestamp)} ${level}${rid}: ${String(message)}${extra}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// In production, log only warnings and errors.
// In development, log everything including debug.
const logLevel = config.isProd ? 'warn' : 'debug';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.isProd ? prodFormat : devFormat,
  }),
];

// Only write files in development — production uses stdout aggregation
if (config.isDev) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  transports,
  // Never log unhandled exceptions to console in prod — use process.on handlers
  exitOnError: false,
});

// ─── Child logger factory ─────────────────────────────────────────────────────
// Create a child logger with a request ID for per-request correlation.
export const createRequestLogger = (requestId: string) =>
  logger.child({ requestId });
