import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import type { UserRole } from '../types/index.js';

// ─── Role-Based Access Control (RBAC) ────────────────────────────────────────
// Usage:
//   router.delete('/resource', protect, authorize('ADMIN'), handler)
//   router.put('/resource', protect, authorize('ADMIN', 'INSTRUCTOR'), handler)
//
// Role hierarchy (highest to lowest):
//   ADMIN > INSTRUCTOR > STUDENT

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
};

/**
 * Require any of the specified roles (OR logic).
 * The user must have AT LEAST ONE of the listed roles.
 */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      next(
        new ForbiddenError(
          `Role '${userRole ?? 'unknown'}' does not have permission to perform this action`
        )
      );
      return;
    }

    next();
  };

/**
 * Require a minimum role level (hierarchy-based).
 * E.g., requireRole('INSTRUCTOR') allows INSTRUCTOR and ADMIN.
 */
export const requireMinRole =
  (minRole: UserRole) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (
      !userRole ||
      ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]
    ) {
      next(
        new ForbiddenError(
          `This action requires at least '${minRole}' role`
        )
      );
      return;
    }

    next();
  };

/**
 * Ensures the requesting user is accessing their own resource.
 * Extracts resource owner ID from req.params[paramName].
 * ADMINs bypass this check.
 */
export const requireOwnership =
  (paramName = 'userId') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const resourceOwnerId = req.params[paramName];
    const requestingUserId = req.user?.id;
    const requestingRole = req.user?.role;

    // Admins can access any resource
    if (requestingRole === 'ADMIN') {
      next();
      return;
    }

    if (resourceOwnerId !== requestingUserId) {
      next(new ForbiddenError('You can only access your own resources'));
      return;
    }

    next();
  };
