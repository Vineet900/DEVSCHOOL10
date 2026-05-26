import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { supabase } from '../database/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to protect routes and verify Supabase JWT
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  try {
    // Validate token with Supabase directly (more robust than manual JWT verify)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      logger.error('Supabase Auth Error: ' + authError?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    logger.info('Middleware authUser ID: ' + authUser.id);

    const meta = authUser.user_metadata || {};
    const oauthName = meta.full_name || meta.name || null;
    const oauthAvatar = meta.avatar_url || meta.picture || null;

    // Fetch profile from DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();
    
    logger.info('Middleware profile lookup result: ' + JSON.stringify({ profile, profileError }));
    
    if (profileError || !profile) {
      logger.info('Profile missing or error in middleware. isNewUser set to true. profileError: ' + JSON.stringify(profileError));
      // Allow new users to proceed so profile can be created in getMe
      req.user = {
          id: authUser.id,
          email: authUser.email,
          role: meta.role || 'STUDENT',
          oauthName,
          oauthAvatar,
          isNewUser: true
      };
      return next();
    }

    // Attach user data to request (consistently using authUser.id / profile.user_id)
    req.user = {
        id: profile.user_id || authUser.id,
        role: profile.role || 'STUDENT',
        username: profile.username,
        oauthName,
        oauthAvatar,
        profile
    };

    next();
  } catch (err) {
    console.error('Auth Middleware Exception:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to perform this action`
      });
    }
    next();
  };
};
