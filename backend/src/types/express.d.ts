// ─── Express Request Augmentation ────────────────────────────────────────────
// Adds `req.user` and `req.requestId` to Express's Request type globally.
// This eliminates the need for casting throughout the codebase.

import type { AuthenticatedUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user — populated by auth.middleware.ts.
       * ALWAYS derived from the JWT/Supabase session.
       * NEVER populated from request body or query params.
       */
      user: AuthenticatedUser;

      /**
       * Unique request ID for distributed tracing.
       * Populated by requestId.middleware.ts.
       */
      requestId: string;
    }
  }
}

export {};
