import axios from 'axios'
import { supabase } from './supabase'

const rawApiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
export const API_BASE_URL = rawApiBase.replace(/\/api\/?$/, '')
const API_ENDPOINT = `${API_BASE_URL}/api`

/**
 * Create axios instance with JWT authentication
 */
const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Add JWT token to request headers if available
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }

    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Handle response errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('Unauthorized request')
    }
    return Promise.reject(error)
  },
)

/**
 * User API endpoints
 */
export const userAPI = {
  /**
   * Get current authenticated user profile
   */
  async getProfile() {
    try {
      const { data } = await apiClient.get('/user/me')
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(updates) {
    try {
      const { data } = await apiClient.put('/user/update', updates)
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const { data } = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Get user sessions
   */
  async getSessions() {
    try {
      const { data } = await apiClient.get('/auth/sessions')
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Logout from all sessions
   */
  async logoutAll() {
    try {
      const { data } = await apiClient.post('/auth/logout-all')
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount() {
    try {
      const { data } = await apiClient.delete('/user/delete')
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  /**
   * Sync user learning stats (XP, Points, Streak, Progress)
   */
  async syncStats(stats) {
    try {
      const { data } = await apiClient.post('/user/sync-stats', stats)
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}

export default apiClient
