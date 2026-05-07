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
  getAnalytics: () => api.get('/analytics')
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
