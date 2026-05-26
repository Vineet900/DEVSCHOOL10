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

      // Automatically append X-Custom-Api-Key if defined in localStorage for AI endpoints
      const customKey = localStorage.getItem('devschoolpro-custom-gemini-key')
      if (customKey) {
        config.headers['X-Custom-Api-Key'] = customKey
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
      console.warn('Unauthorized request - session may be expired')
    }
    return Promise.reject(error)
  },
)

/**
 * Auth API — maps to backend /api/v1/auth/*
 * Backward compat alias /api/auth/* also works
 */
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
  verify: (email, otp) => apiClient.post('/auth/verify', { email, otp, type: 'email' }),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  google: (idToken) => apiClient.post('/auth/google', { idToken }),
}

/**
 * User API — maps to backend /api/v1/users/*
 * Backward compat alias /api/user/* also works
 */
export const userAPI = {
  getProfile: () => apiClient.get('/auth/me'),
  updateProfile: (updates) => apiClient.put('/auth/profile', updates),
  syncStats: (stats) => apiClient.post('/user/sync-stats', stats),
  convertXP: () => apiClient.post('/v1/users/convert-xp'),
  getLeaderboard: (page = 1, limit = 20) => apiClient.get(`/v1/users/leaderboard?page=${page}&limit=${limit}`),
}

/**
 * Course & Learning API — maps to backend /api/v1/courses/*
 * Backward compat alias /api/courses/* also works
 */
export const courseAPI = {
  getCourses: () => apiClient.get('/courses'),
  getCourse: (id) => apiClient.get(`/courses/${id}`),
  getLesson: (lessonId) => apiClient.get(`/v1/courses/lessons/${lessonId}`),
  getLessonsBySection: (courseId, sectionId) => apiClient.get(`/v1/courses/${courseId}/sections/${sectionId}/lessons`),
  enroll: (courseId) => apiClient.post('/v1/courses/enroll', { courseId }),
  getEnrolled: () => apiClient.get('/v1/courses/enrolled/me'),
}

/**
 * Progress API — maps to backend /api/v1/progress/*
 */
export const progressAPI = {
  getAll: () => apiClient.get('/v1/progress'),
  getCourseProgress: (courseId) => apiClient.get(`/v1/progress/course/${courseId}`),
  updateProgress: (lessonId, isCompleted = true) => apiClient.post('/v1/progress', { lessonId, isCompleted }),
}

/**
 * Quiz API — maps to backend /api/v1/quizzes/*
 */
export const quizAPI = {
  getQuiz: (quizId) => apiClient.get(`/v1/quizzes/${quizId}`),
  submitAttempt: (quizId, answers) => apiClient.post(`/v1/quizzes/${quizId}/submit`, { answers }),
  getResults: (quizId) => apiClient.get(`/v1/quizzes/${quizId}/results`),
}

/**
 * AI Teacher API — maps to backend /api/v1/ai/*
 */
export const teacherAPI = {
  ask: (payload) => apiClient.post('/v1/ai/chat', payload),
  generateQuiz: (payload) => apiClient.post('/v1/ai/generate-quiz', payload),
  generateRoadmap: (payload) => apiClient.post('/v1/ai/generate-roadmap', payload),
  getTokens: () => apiClient.get('/v1/ai/tokens'),
  enhanceLesson: (lessonId) => apiClient.post('/v1/ai/enhance-lesson', { lessonId }),
}

// Legacy alias for tutorAPI
export const tutorAPI = teacherAPI

/**
 * Certificate API — maps to backend /api/v1/certificates/*
 */
export const certificateAPI = {
  generate: (courseId) => apiClient.post(`/v1/certificates/generate/${courseId}`),
  verify: (code) => apiClient.get(`/v1/certificates/verify/${code}`),
}

/**
 * Upload API — maps to backend /api/v1/uploads/*
 */
export const uploadAPI = {
  uploadAvatar: (formData) => apiClient.post('/v1/uploads/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

/**
 * Roadmap API
 */
export const roadmapAPI = {
  getUserRoadmaps: () => Promise.resolve({ data: { success: true, data: [] } }),
  createUserRoadmap: (roadmap) => apiClient.post('/v1/ai/generate-roadmap', roadmap),
  deleteUserRoadmap: (id) => apiClient.delete(`/v1/roadmaps/${id}`),
}

/**
 * Admin API — maps to backend /api/v1/admin/*
 */
export const adminAPI = {
  getDashboard: () => apiClient.get('/v1/admin/dashboard'),
  getUsers: (page = 1, limit = 20) => apiClient.get(`/v1/admin/users?page=${page}&limit=${limit}`),
  updateUser: (id, data) => apiClient.put(`/v1/admin/users/${id}`, data),
  banUser: (id, banned) => apiClient.put(`/v1/admin/users/${id}/ban`, { banned }),
  refillTokens: (id, amount) => apiClient.post(`/v1/admin/users/${id}/refill-tokens`, { amount }),
  getCourses: (page = 1) => apiClient.get(`/v1/admin/courses?page=${page}`),
  createCourse: (data) => apiClient.post('/v1/admin/courses', data),
  updateCourse: (id, data) => apiClient.put(`/v1/admin/courses/${id}`, data),
  deleteCourse: (id) => apiClient.delete(`/v1/admin/courses/${id}`),
  getSettings: () => apiClient.get('/v1/admin/settings'),
  updateSettings: (settings) => apiClient.put('/v1/admin/settings', { settings }),
  sendNotification: (data) => apiClient.post('/v1/admin/notifications', data),
  getRedeems: () => apiClient.get('/v1/admin/redeems'),
  updateRedeem: (id, status) => apiClient.put(`/v1/admin/redeems/${id}`, { status }),
  getModeration: () => apiClient.get('/v1/admin/moderation'),
  resolveReport: (id, status) => apiClient.put(`/v1/admin/moderation/${id}`, { status }),
  getLogs: (page = 1) => apiClient.get(`/v1/admin/logs?page=${page}`),
  getStats: () => apiClient.get('/v1/admin/dashboard'),
  getHealth: () => apiClient.get('/v1/admin/health'),
  getAllUsers: () => apiClient.get('/v1/admin/users?page=1&limit=1000'),
  getAuditLogs: (page = 1) => apiClient.get(`/v1/admin/logs?page=${page}`),
  manageUser: (id, data) => apiClient.put(`/v1/admin/users/${id}`, data),
  adjustPoints: (userId, amount, reason) => apiClient.post(`/v1/admin/users/${userId}/refill-tokens`, { amount }),
}

export default apiClient
