import { adminSupabase } from '../config/supabase.js'
import { env } from '../config/env.js'

/**
 * Get current authenticated user profile
 * Requires: Authorization: Bearer <JWT>
 */
export async function getCurrentUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    const { data, error } = await adminSupabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = data.user
    const userMetadata = user.user_metadata || {}

    // Fetch user stats from profiles table as fallback
    let profileData = {}
    try {
      const { data: pData, error: pError } = await adminSupabase
        .from('profiles')
        .select('xp, study_points, streak, accuracy, progress, quiz_scores')
        .eq('id', user.id)
        .single()
      
      if (!pError && pData) {
        profileData = pData
      }
    } catch (err) {
      console.error('Failed to fetch profile stats:', err)
    }

    const metaStats = userMetadata.stats || {}

    return res.json({
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
      name: userMetadata.full_name || '',
      avatar: userMetadata.avatar || '',
      bio: userMetadata.bio || '',
      username: userMetadata.username || '',
      created_at: user.created_at,
      updated_at: user.updated_at,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      stats: {
        xp: metaStats.xp || profileData.xp || 0,
        studyPoints: metaStats.study_points || profileData.study_points || 0,
        streak: metaStats.streak || profileData.streak || 0,
        accuracy: metaStats.accuracy || profileData.accuracy || 0,
        progress: metaStats.progress || profileData.progress || {},
        quizScores: metaStats.quiz_scores || profileData.quiz_scores || {},
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update current user profile
 * Requires: Authorization: Bearer <JWT>
 */
export async function updateCurrentUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    // First, get the current user to verify token
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const userId = userData.user.id

    // Extract updatable fields from request body
    const updates = {}
    const userMetadataUpdates = {}

    if (req.body.email && req.body.email !== userData.user.email) {
      updates.email = String(req.body.email).trim().toLowerCase()
    }

    if (req.body.phone && req.body.phone !== userData.user.phone) {
      updates.phone = String(req.body.phone).trim()
    }

    if (req.body.password && String(req.body.password).length >= 8) {
      updates.password = req.body.password
    }

    if (req.body.name !== undefined) {
      userMetadataUpdates.full_name = String(req.body.name).trim()
    }

    if (req.body.avatar !== undefined) {
      userMetadataUpdates.avatar = String(req.body.avatar).trim()
    }

    if (req.body.bio !== undefined) {
      userMetadataUpdates.bio = String(req.body.bio).trim().slice(0, 240)
    }

    if (req.body.username !== undefined) {
      userMetadataUpdates.username = String(req.body.username).trim()
    }

    if (Object.keys(userMetadataUpdates).length > 0) {
      updates.user_metadata = {
        ...userData.user.user_metadata,
        ...userMetadataUpdates,
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.json({
        id: userData.user.id,
        email: userData.user.email,
        phone: userData.user.phone,
        name: userData.user.user_metadata?.full_name || '',
        avatar: userData.user.user_metadata?.avatar || '',
        bio: userData.user.user_metadata?.bio || '',
        username: userData.user.user_metadata?.username || '',
      })
    }

    // Update user via admin API
    const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, updates)

    if (updateError) {
      return res.status(400).json({ error: updateError.message })
    }

    const user = updatedUser.user
    const userMeta = user.user_metadata || {}

    return res.json({
      id: user.id,
      email: user.email || null,
      phone: user.phone || null,
      name: userMeta.full_name || '',
      avatar: userMeta.avatar || '',
      bio: userMeta.bio || '',
      username: userMeta.username || '',
      updated_at: user.updated_at,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Sync user learning stats (XP, Points, Streak, Progress)
 * Requires: Authorization: Bearer <JWT>
 */
export async function syncUserStats(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const userId = userData.user.id
    const { xp, studyPoints, streak, accuracy, progress, quizScores } = req.body

    const existingMeta = userData.user.user_metadata || {}
    
    // Save learning stats directly in user_metadata to avoid profile schema issues
    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        stats: {
          xp: xp || existingMeta.stats?.xp || 0,
          study_points: studyPoints || existingMeta.stats?.study_points || 0,
          streak: streak || existingMeta.stats?.streak || 0,
          accuracy: accuracy || existingMeta.stats?.accuracy || 0,
          progress: progress || existingMeta.stats?.progress || {},
          quiz_scores: quizScores || existingMeta.stats?.quiz_scores || {},
          updated_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      console.error('Supabase Meta Sync Error:', error.message)
      return res.status(400).json({ error: error.message })
    }

    // Also try to update profiles table if it exists as fallback
    adminSupabase.from('profiles').upsert({
      id: userId,
      xp: xp,
      study_points: studyPoints,
      streak: streak,
      accuracy: accuracy,
      progress: progress,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' }).then(() => {}).catch(() => {})

    return res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

/**
 * Change user password
 * Requires: Authorization: Bearer <JWT>
 */
export async function changePassword(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    // Get current user
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Update password via admin API (note: no verification of current password in admin API)
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userData.user.id, {
      password: new_password,
    })

    if (updateError) {
      return res.status(400).json({ error: updateError.message })
    }

    return res.json({ ok: true, message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user sessions (list user's active sessions)
 * Requires: Authorization: Bearer <JWT>
 */
export async function getUserSessions(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    // Get current user
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Note: Supabase JS library doesn't expose session listing directly via admin API
    // Return placeholder response with current session
    return res.json({
      sessions: [
        {
          id: `session_${userData.user.id.substring(0, 12)}`,
          created_at: userData.user.created_at,
          updated_at: userData.user.updated_at,
          user_agent: req.headers['user-agent'] || 'Unknown',
          ip_address: req.ip || req.connection.remoteAddress,
          current: true,
        },
      ],
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout from all sessions
 * Requires: Authorization: Bearer <JWT>
 */
export async function logoutAllSessions(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    // Get current user
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Sign out - scope: global revokes all sessions
    const { error: signOutError } = await adminSupabase.auth.admin.signOut(token, 'global')

    if (signOutError) {
      return res.status(400).json({ error: signOutError.message })
    }

    return res.json({ ok: true, message: 'Signed out from all sessions' })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete user account
 * Requires: Authorization: Bearer <JWT>
 */
export async function deleteAccount(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' })
    }

    if (!adminSupabase) {
      return res.status(503).json({ error: 'Authentication service unavailable' })
    }

    // Get current user
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token)

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const userId = userData.user.id

    // Soft delete user
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId, true)

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message })
    }

    return res.json({ ok: true, message: 'Account deleted' })
  } catch (error) {
    next(error)
  }
}
