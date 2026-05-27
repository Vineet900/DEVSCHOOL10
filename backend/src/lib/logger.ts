import pino from 'pino';
import { config } from '../config/index.js';

const isDev = config.env === 'development';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.env,
    service: 'devschool-backend',
  },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname,env,service',
      },
    },
  }),
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-custom-api-key"]', 'body.password', 'body.token'],
    censor: '***REDACTED***',
  },
});

// Wrapper to make Pino compatible with existing Winston-style calls: logger.error('msg', { meta })
export const logger = {
  info: (msg: string, meta?: any) => meta ? baseLogger.info(meta, msg) : baseLogger.info(msg),
  error: (msg: string, meta?: any) => meta ? baseLogger.error(meta, msg) : baseLogger.error(msg),
  warn: (msg: string, meta?: any) => meta ? baseLogger.warn(meta, msg) : baseLogger.warn(msg),
  debug: (msg: string, meta?: any) => meta ? baseLogger.debug(meta, msg) : baseLogger.debug(msg),
  // For pino-http support, expose the base logger
  pinoLogger: baseLogger,
};
