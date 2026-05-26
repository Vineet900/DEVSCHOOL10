import type { PaginationMeta, PaginationQuery } from '../types/index.js';
import { z } from 'zod';

// ─── Pagination Utilities ─────────────────────────────────────────────────────

const MAX_LIMIT = 100; // Hard cap — prevents abuse with limit=999999

// ─── Query Parser ─────────────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
});

export type ParsedPagination = z.infer<typeof paginationSchema>;

// ─── Supabase Range Calculator ────────────────────────────────────────────────
// Returns { from, to } for Supabase .range(from, to)
export const getRange = (page: number, limit: number) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
};

// ─── Pagination Meta Builder ──────────────────────────────────────────────────
export const buildPaginationMeta = (
  totalItems: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    totalPages,
    currentPage: page,
    perPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// ─── Full Pagination Result ───────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export const paginate = <T>(
  data: T[],
  totalItems: number,
  query: { page: number; limit: number }
): PaginatedResult<T> => ({
  data,
  meta: buildPaginationMeta(totalItems, query.page, query.limit),
});
