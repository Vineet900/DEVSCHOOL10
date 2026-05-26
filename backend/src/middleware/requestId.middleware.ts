import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// ─── Request ID Middleware ────────────────────────────────────────────────────
// Attaches a unique UUID to every request for distributed tracing.
// Checks if the client passed X-Request-ID (for trace propagation from frontend).
// Adds the ID to the response header so clients can correlate requests.
//
// This is essential for debugging production issues — you can grep CloudWatch
// logs by request ID to trace the full lifecycle of a single request.

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 64
      ? incoming
      : randomUUID();

  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
