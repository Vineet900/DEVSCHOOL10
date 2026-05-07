import express from 'express'
import { changePassword, deleteAccount, getCurrentUser, getUserSessions, logoutAllSessions, updateCurrentUser, syncUserStats } from '../controllers/userController.js'

const router = express.Router()

/**
 * GET /api/user/me
 * Get current authenticated user profile
 * Requires: Authorization: Bearer <JWT>
 */
router.get('/me', getCurrentUser)

/**
 * PUT /api/user/update
 * Update current user profile
 * Requires: Authorization: Bearer <JWT>
 */
router.put('/update', updateCurrentUser)

/**
 * POST /api/user/sync-stats
 * Sync user learning stats (XP, Points, Streak, Progress)
 * Requires: Authorization: Bearer <JWT>
 */
router.post('/sync-stats', syncUserStats)

/**
 * POST /api/auth/change-password
 * Change user password
 * Requires: Authorization: Bearer <JWT>
 */
router.post('/auth/change-password', changePassword)

/**
 * GET /api/auth/sessions
 * Get user sessions
 * Requires: Authorization: Bearer <JWT>
 */
router.get('/auth/sessions', getUserSessions)

/**
 * POST /api/auth/logout-all
 * Logout from all sessions
 * Requires: Authorization: Bearer <JWT>
 */
router.post('/auth/logout-all', logoutAllSessions)

/**
 * DELETE /api/user/delete
 * Delete user account
 * Requires: Authorization: Bearer <JWT>
 */
router.delete('/delete', deleteAccount)

export default router
