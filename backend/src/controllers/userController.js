import { supabase } from '../database/supabase.js';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(), // Stores JSON-encoded extended profile data
  avatar_url: z.string().url().or(z.literal('')).optional(),
  username: z.string().min(3).max(30).optional(),
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const validatedData = profileUpdateSchema.parse(req.body);

    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Sync real-time learning stats to Supabase profiles table
 * @route   POST /api/v1/users/sync-stats
 */
export const syncStats = async (req, res, next) => {
  try {
    const { 
      xp, 
      studyPoints, 
      streak, 
      accuracy, 
      progress, 
      quizScores,
      studyHours,
      studyTimeMinutes,
      lastActiveDate
    } = req.body;
    const updates = {};

    // Only include fields that were actually sent to avoid nulling out others
    if (xp !== undefined && Number.isFinite(Number(xp))) {
      updates.xp = Math.max(0, Number(xp));
    }
    if (studyPoints !== undefined && Number.isFinite(Number(studyPoints))) {
      updates.study_points = Math.max(0, Number(studyPoints));
    }
    if (streak !== undefined && Number.isFinite(Number(streak))) {
      updates.streak = Math.max(0, Number(streak));
    }
    if (accuracy !== undefined && Number.isFinite(Number(accuracy))) {
      updates.accuracy = Math.max(0, Math.min(100, Number(accuracy)));
    }
    if (progress && typeof progress === 'object') {
      updates.progress = progress;
    }
    if (quizScores && typeof quizScores === 'object') {
      updates.quiz_scores = quizScores;
    }
    if (studyHours !== undefined && Number.isFinite(Number(studyHours))) {
      updates.study_hours = Math.max(0, Number(studyHours));
    }
    if (studyTimeMinutes !== undefined && Number.isFinite(Number(studyTimeMinutes))) {
      updates.study_time_minutes = Math.max(0, Number(studyTimeMinutes));
    }
    if (lastActiveDate !== undefined) {
      updates.last_active_date = lastActiveDate;
    }
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      // Only updated_at was set — nothing meaningful to save
      return res.status(200).json({ success: true, message: 'No stats to sync' });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Stats synced successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Convert XP to Study Points (Atomic)
 * @route   POST /api/v1/users/convert-xp
 */
export const convertXPToSP = async (req, res, next) => {
  try {
    const { amount } = req.body; // XP amount (multiple of 100)
    
    if (!amount || amount < 100 || amount % 100 !== 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a multiple of 100 XP' });
    }

    const spReward = amount / 100;

    // Call Atomic RPC Function to prevent race conditions
    const { error } = await supabase.rpc('award_user_reward', {
      p_user_id: req.user.id,
      p_xp_amount: -amount, // Deduct XP
      p_sp_amount: spReward, // Add SP
      p_description: `XP Conversion: ${amount} XP to ${spReward} SP`
    });

    if (error) throw error;

    res.status(200).json({ success: true, message: `Successfully converted ${amount} XP to ${spReward} SP` });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get Global Leaderboard
 * @route   GET /api/v1/users/leaderboard
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, xp, level')
      .order('xp', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
