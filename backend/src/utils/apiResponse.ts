import type { Response } from 'express';
import type { PaginationMeta } from '../types/index.js';

// ─── Consistent API Response Helpers ─────────────────────────────────────────
// Standardizes every API response shape across the entire codebase.
// Eliminates ad-hoc { success: true, data: ... } patterns.

export const sendSuccess = <T>(
  res: Response,
  data: T,
  options?: {
    statusCode?: number;
    message?: string;
    meta?: PaginationMeta;
  }
): Response => {
  return res.status(options?.statusCode ?? 200).json({
    success: true,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  options?: {
    statusCode?: number;
    code?: string;
    errors?: Record<string, string[]>;
    requestId?: string;
  }
): Response => {
  return res.status(options?.statusCode ?? 500).json({
    success: false,
    message,
    ...(options?.code && { code: options.code }),
    ...(options?.errors && { errors: options.errors }),
    ...(options?.requestId && { requestId: options.requestId }),
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): Response => sendSuccess(res, data, { statusCode: 201, message });

export const sendNoContent = (res: Response): Response =>
  res.status(204).send();
