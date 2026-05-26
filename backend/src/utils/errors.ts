// ─── Custom Error Classes ─────────────────────────────────────────────────────
// Standardized error hierarchy for consistent HTTP responses.
// All errors carry a status code and optional machine-readable code string.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Signals: recoverable, safe to send to client
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// 400 — Validation / bad request
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// 401 — Authentication required
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

// 403 — Insufficient permissions
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

// 404 — Resource not found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// 409 — Conflict (e.g. duplicate)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// 402 — Payment required (AI tokens exhausted)
export class InsufficientTokensError extends AppError {
  constructor() {
    super(
      'You have run out of AI tokens. Please add more tokens to continue.',
      402,
      'INSUFFICIENT_TOKENS'
    );
  }
}

// 429 — Rate limit exceeded
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// 502 — Upstream service error (AI provider)
export class UpstreamError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message ?? `${service} is temporarily unavailable. Please retry.`,
      502,
      'UPSTREAM_ERROR'
    );
  }
}
