import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { AuthenticationError } from '../utils/errors.js';
import type { AuthenticatedUser, UserRole } from '../types/index.js';

// ─── Auth Middleware ──────────────────────────────────────────────────────────
// THE ONLY auth middleware in this codebase. No duplicate.
//
// Security guarantees:
// 1. Token is ONLY extracted from Authorization header or httpOnly cookie.
// 2. req.user.id is ALWAYS the Supabase auth user ID from the JWT.
//    It is NEVER sourced from req.body, req.query, or req.params.
// 3. Profile is fetched server-side — client cannot inject role or permissions.

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Extract from Authorization header (preferred for mobile/API clients)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback: httpOnly cookie (preferred for web clients — CSRF resistant)
  else if (req.cookies?.token) {
    token = req.cookies.token as string;
  }

  if (!token) {
    next(new AuthenticationError('No authentication token provided'));
    return;
  }

  try {
    // Validate token via Supabase Auth — verifies signature + expiry
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      logger.warn('[Auth] Token validation failed', {
        requestId: req.requestId,
        error: authError?.message,
      });
      next(new AuthenticationError('Invalid or expired token'));
      return;
    }

    // Fetch profile for role and ban status — server controlled, NOT client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role, is_banned, username, full_name, avatar_url, ai_tokens, xp, study_points')
      .eq('user_id', authUser.id)
      .maybeSingle();

    // Check if user is banned
    if (profile?.is_banned === true) {
      logger.warn('[Auth] Banned user attempted access', {
        userId: authUser.id,
        requestId: req.requestId,
      });
      next(new AuthenticationError('Your account has been suspended'));
      return;
    }

    const meta = authUser.user_metadata ?? {};

    // Build the authenticated user object
    // If no profile yet (first OAuth login), allow through with isNewUser flag
    const authenticatedUser: AuthenticatedUser = {
      id: authUser.id, // ← THE ONLY source of user identity
      email: authUser.email ?? null,
      role: (profile?.role as UserRole) ?? 'STUDENT',
      oauthName: (meta['full_name'] as string) || (meta['name'] as string) || null,
      oauthAvatar: (meta['avatar_url'] as string) || (meta['picture'] as string) || null,
      isNewUser: !profile || !!profileError,
      profile: profile ?? undefined,
    };

    req.user = authenticatedUser;
    next();
  } catch (err) {
    logger.error('[Auth] Middleware exception', {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : 'Unknown',
    });
    next(new AuthenticationError('Authentication failed'));
  }
};

// ─── Optional Auth ────────────────────────────────────────────────────────────
// For routes that work both authenticated and unauthenticated.
// Sets req.user if token is valid, silently continues if not.
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token as string;
  }

  if (!token) {
    next();
    return;
  }

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser(token);

    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, role, is_banned')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!profile?.is_banned) {
        req.user = {
          id: authUser.id,
          email: authUser.email ?? null,
          role: (profile?.role as UserRole) ?? 'STUDENT',
        };
      }
    }
  } catch {
    // Silently ignore — optional auth
  }

  next();
};
