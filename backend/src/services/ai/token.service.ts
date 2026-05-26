import { supabase } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import type { TokenDeductionResult } from '../../types/index.js';

// ─── Atomic AI Token Service ──────────────────────────────────────────────────
// FIX #1: Race Condition — Concurrent requests allowing infinite free AI calls
//
// THE PROBLEM with the old approach:
//   1. Read ai_tokens from DB
//   2. Calculate: next = current - 1
//   3. Write: ai_tokens = next
//
// Under concurrency: 50 parallel requests all read ai_tokens=5, all write 4.
// Result: 50 API calls made, only 1 token deducted. Financial disaster.
//
// THE FIX: Supabase RPC with atomic UPDATE in a single DB transaction.
// The SQL function uses: UPDATE ... SET ai_tokens = GREATEST(0, ai_tokens - 1)
// WHERE ai_tokens > 0 — atomically. No read. No race condition possible.
//
// PREREQUISITE: Run sql/functions.sql in Supabase SQL Editor first.

export class TokenService {
  /**
   * Atomically check and deduct one AI token for a user.
   * This is a single DB round trip — no read-then-write pattern.
   *
   * @param userId - MUST come from req.user.id (JWT), never from request body
   * @param bypassTokens - True if user provided their own API key
   */
  async deductToken(
    userId: string,
    bypassTokens = false
  ): Promise<TokenDeductionResult> {
    // If user is using their own API key, skip token deduction entirely
    if (bypassTokens) {
      return { success: true };
    }

    try {
      const { data, error } = await supabase.rpc('deduct_ai_token', {
        p_user_id: userId,
      });

      if (error) {
        logger.error('[TokenService] RPC error during deduction', {
          userId,
          error: error.message,
        });
        return { success: false, reason: 'db_error' };
      }

      // The RPC returns: { success: boolean, remaining?: number, reason?: string }
      const result = data as { success: boolean; remaining?: number; reason?: string };

      if (!result.success) {
        return {
          success: false,
          reason: (result.reason as TokenDeductionResult['reason']) ?? 'insufficient_tokens',
        };
      }

      logger.info('[TokenService] Token deducted', {
        userId,
        remaining: result.remaining,
      });

      return { success: true, remaining: result.remaining };
    } catch (err) {
      logger.error('[TokenService] Unexpected error', {
        userId,
        error: err instanceof Error ? err.message : 'Unknown',
      });
      return { success: false, reason: 'db_error' };
    }
  }

  /**
   * Check current token balance WITHOUT deducting.
   * Use this for pre-flight checks on expensive AI operations.
   */
  async getBalance(userId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('ai_tokens')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.ai_tokens as number;
  }

  /**
   * Admin-only: Refill a user's AI tokens.
   * Logs to admin_logs for audit trail.
   */
  async refillTokens(
    userId: string,
    amount: number,
    adminId: string
  ): Promise<boolean> {
    const { error } = await supabase.rpc('refill_ai_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_admin_id: adminId,
    });

    if (error) {
      logger.error('[TokenService] Refill failed', { userId, amount, error: error.message });
      return false;
    }

    return true;
  }
}

export const tokenService = new TokenService();
