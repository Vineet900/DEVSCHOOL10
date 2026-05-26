import api from './api'

export const dashboardService = {
  getOverview: () => api.get('/dashboard')
}

export const usersService = {
  getUsers: () => api.get('/users'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  banUser: (id, banned) => api.post(`/users/${id}/ban`, { banned })
}

export const coursesService = {
  getCourses: () => api.get('/courses'),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getLessons: (courseId) => api.get(`/courses/${courseId}/lessons`),
  createLesson: (courseId, data) => api.post(`/courses/${courseId}/lessons`, data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`)
}

export const quizzesService = {
  getQuizzes: () => api.get('/quizzes'),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`)
}

export const analyticsService = {
  getAnalytics: () => api.get('/analytics'),
  getStats: () => api.get('/analytics')
}

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data)
}

export const pointsService = {
  getTransactions: () => api.get('/points'),
  adjustPoints: (data) => api.post('/points/adjust', data)
}

export const aiService = {
  getSettings: () => api.get('/ai'),
  updateSettings: (data) => api.put('/ai', data)
}

export const assessmentsService = {
  getAssessments: () => api.get('/assessments'),
  createAssessment: (data) => api.post('/assessments', data)
}

export const chaptersService = {
  getChapters: (courseId) => api.get(`/courses/${courseId}/sections`),
  createChapter: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
  updateChapter: (id, data) => api.put(`/sections/${id}`, data),
  deleteChapter: (id) => api.delete(`/sections/${id}`),
  bulkUploadChapters: (courseId, data) => api.post(`/courses/${courseId}/sections/bulk`, data)
}

export const rewardsService = {
  getRedeemRequests: () => api.get('/rewards/redeem-requests'),
  updateRedeemStatus: (id, status) => api.put(`/rewards/redeem-requests/${id}`, { status }),
  getCoupons: () => api.get('/rewards/coupons'),
  createCoupon: (data) => api.post('/rewards/coupons', data),
  deleteCoupon: (id) => api.delete(`/rewards/coupons/${id}`)
}

export const notificationsService = {
  sendNotification: (data) => api.post('/notifications/send', data)
}

export const moderationService = {
  getReports: () => api.get('/moderation/reports'),
  resolveReport: (id, status) => api.put(`/moderation/reports/${id}`, { status }),
  deleteContent: (contentType, contentId) => api.post('/moderation/delete-content', { contentType, contentId })
}

export const logsService = {
  getLogs: () => api.get('/logs')
}





