import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

// ─── Zod Validation Middleware ────────────────────────────────────────────────
// Validates req.body, req.query, or req.params against a Zod schema.
// On failure: returns 400 with field-level error details.
// On success: replaces the source with the parsed/coerced/stripped value.
//
// Usage:
//   router.post('/resource', validate(mySchema), handler)
//   router.get('/resource', validate(querySchema, 'query'), handler)

type ValidateSource = 'body' | 'query' | 'params';

export const validate =
  <T>(schema: ZodSchema<T>, source: ValidateSource = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      sendError(res, 'Validation failed', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        errors,
        requestId: req.requestId,
      });
      return;
    }

    // Replace source with parsed/stripped data (removes unknown fields)
    // This is the key to preventing mass assignment — unknown fields are stripped
    if (source === 'query') {
      // req.query is read-only in Express — merge parsed values onto it
      const parsed = result.data as Record<string, unknown>;
      for (const key of Object.keys(req.query)) {
        delete (req.query as Record<string, unknown>)[key];
      }
      Object.assign(req.query, parsed);
    } else {
      (req[source] as unknown) = result.data;
    }
    next();
  };

// ─── Format ZodError to field-keyed error map ─────────────────────────────────
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root';
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(issue.message);
  }

  return errors;
};
