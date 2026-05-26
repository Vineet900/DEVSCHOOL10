import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { paginationSchema } from '../../../utils/pagination.js';
import { paginate } from '../../../utils/pagination.js';
import { supabase } from '../../../lib/supabase.js';

const router = Router();

// ─── GET /api/v1/users/leaderboard ────────────────────────
// Public endpoint — no auth required
router.get('/leaderboard', validate(paginationSchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };

  const { data, total } = await userRepository.getLeaderboard({ page, limit });

  const result = paginate(data, total, { page, limit });
  return sendSuccess(res, result.data, { meta: result.meta });
}));

// ─── GET /api/v1/users/me ─────────────────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  const profile = await userRepository.findByUserId(req.user.id);
  return sendSuccess(res, profile);
}));

// ─── POST /api/v1/users/convert-xp ───────────────────────
// Server-controlled XP → SP conversion via atomic RPC
router.post('/convert-xp', protect, asyncHandler(async (req, res) => {
  const userId = req.user.id; // ← ALWAYS from JWT

  const { data: balance } = await supabase
    .from('profiles')
    .select('xp')
    .eq('user_id', userId)
    .single();

  const xpAvailable = (balance?.xp as number) ?? 0;

  if (xpAvailable < 100) {
    return sendSuccess(res, { message: 'Need at least 100 XP to convert' }, { statusCode: 200 });
  }

  const { data, error } = await supabase.rpc('convert_xp_to_sp', {
    p_user_id: userId,
    p_xp_amount: xpAvailable,
  });

  if (error) throw error;

  return sendSuccess(res, data, { message: 'XP converted to Study Points' });
}));

export default router;
