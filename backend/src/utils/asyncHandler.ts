import type { Request, Response, NextFunction } from 'express';

// ─── Async Handler Wrapper ────────────────────────────────────────────────────
// Eliminates try/catch boilerplate in every controller.
// Catches any promise rejection and forwards it to the global error handler.
//
// Usage:
//   router.get('/resource', asyncHandler(myController));

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
