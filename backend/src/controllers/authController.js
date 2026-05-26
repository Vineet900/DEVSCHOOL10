import { supabase, supabaseAuth } from '../database/supabase.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

/**
 * @desc    Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    logger.info('getMe req.user: ' + JSON.stringify(req.user));
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*, wallets(*), streaks(*)')
      .eq('user_id', req.user.id)
      .maybeSingle();

    logger.info('getMe profile query result: ' + JSON.stringify({ profile, error }));

    if (error) {
      logger.error('getMe profile query error: ' + error.message);
      throw error;
    }

    // If profile is missing (e.g. first time Google login), create it
    if (!profile) {
        logger.info('Profile missing in getMe. Creating new profile...');
        const username = req.user.email ? req.user.email.split('@')[0] : `agent_${Math.floor(Math.random() * 10000)}`;
        const fullName = req.user.oauthName || 'New Learner';
        const avatarUrl = req.user.oauthAvatar || null;
        
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                user_id: req.user.id,
                username,
                full_name: fullName,
                avatar_url: avatarUrl,
                xp: 0,
                level: 1,
                study_points: 0,
                streak: 0,
                accuracy: 0,
                progress: {},
                quiz_scores: {},
                ai_tokens: 50,
            })
            .select()
            .single();
        
        if (createError) {
          logger.error('getMe profile create error: ' + createError.message);
          throw createError;
        }
        
        // Also create wallet and streak
        await supabase.from('wallets').insert({ user_id: req.user.id, balance: 0 });
        await supabase.from('streaks').insert({ user_id: req.user.id, current_streak: 0 });
        
        profile = newProfile;
    } else {
        // If profile exists, check if name is 'New Agent' or avatar_url is missing, and update with Google OAuth data
        let needsUpdate = false;
        const updates = {};
        
        if ((profile.full_name === 'New Agent' || !profile.full_name) && req.user.oauthName) {
            updates.full_name = req.user.oauthName;
            needsUpdate = true;
        }
        
        if (!profile.avatar_url && req.user.oauthAvatar) {
            updates.avatar_url = req.user.oauthAvatar;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            logger.info('Updating profile with Google OAuth data: ' + JSON.stringify(updates));
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('user_id', req.user.id)
                .select()
                .single();
            
            if (!updateError && updatedProfile) {
                profile = { ...profile, ...updatedProfile };
            }
        }
    }

    res.status(200).json({
      success: true,
      data: {
        ...req.user,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Register new user via Supabase
 */
export const register = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      username: z.string().min(3),
      name: z.string().optional(),
      phone: z.string().optional()
    });
    const { email, password, username, name, phone } = schema.parse(req.body);

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: name, phone }
      }
    });

    if (error) throw error;

    // Trigger profile sync via hook or manual call (we'll do manual here for certainty)
    if (data.user) {
        await supabase.from('profiles').insert({
            user_id: data.user.id,
            username,
            full_name: name,
            xp: 0,
            level: 1,
            study_points: 0,
            streak: 0,
            accuracy: 0,
            progress: {},
            quiz_scores: {},
            ai_tokens: 50,
        });
        await supabase.from('wallets').insert({ user_id: data.user.id, balance: 0 });
        await supabase.from('streaks').insert({ user_id: data.user.id, current_streak: 0 });
    }

    res.status(201).json({ success: true, message: 'Registration initiated. Please verify OTP.', data });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user via Supabase
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify OTP
 */
export const verify = async (req, res, next) => {
  try {
    const { email, otp, type = 'signup' } = req.body;
    const { data, error } = await supabaseAuth.auth.verifyOtp({ email, token: otp, type });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout user
 */
export const logout = async (req, res, next) => {
  try {
    const { error } = await supabaseAuth.auth.signOut();
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const syncProfile = async (req, res, next) => {
    // Legacy sync logic for webhooks
    res.status(200).json({ success: true });
};
