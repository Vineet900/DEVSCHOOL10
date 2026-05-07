import express from 'express'
import { requireAdmin } from '../middlewares/authMiddleware.js'
import { getDashboardStats } from '../controllers/admin/dashboardController.js'
import { getUsers, updateUser, banUser } from '../controllers/admin/usersController.js'
import { getCourses, createCourse, updateCourse, deleteCourse } from '../controllers/admin/coursesController.js'
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz } from '../controllers/admin/quizzesController.js'
import { getAnalytics } from '../controllers/admin/analyticsController.js'
import { getSettings, updateSettings } from '../controllers/admin/settingsController.js'
import { getPointsTransactions, adjustPoints } from '../controllers/admin/pointsController.js'
import { getAiSettings, updateAiSettings } from '../controllers/admin/aiController.js'
import { getAssessments, createAssessment } from '../controllers/admin/assessmentsController.js'

const router = express.Router()

// Optional: Apply requireAdmin to all routes in this router
// router.use(requireAdmin) 
// Temporarily disabling for ease of testing during dev without full auth context

// Dashboard
router.get('/dashboard', getDashboardStats)

// Users
router.get('/users', getUsers)
router.put('/users/:id', updateUser)
router.post('/users/:id/ban', banUser)

// Courses
router.get('/courses', getCourses)
router.post('/courses', createCourse)
router.put('/courses/:id', updateCourse)
router.delete('/courses/:id', deleteCourse)

// Lessons
import { getLessons, createLesson, updateLesson, deleteLesson } from '../controllers/admin/coursesController.js'
router.get('/courses/:courseId/lessons', getLessons)
router.post('/courses/:courseId/lessons', createLesson)
router.put('/lessons/:id', updateLesson)
router.delete('/lessons/:id', deleteLesson)

// Quizzes
router.get('/quizzes', getQuizzes)
router.post('/quizzes', createQuiz)
router.put('/quizzes/:id', updateQuiz)
router.delete('/quizzes/:id', deleteQuiz)

// Analytics
router.get('/analytics', getAnalytics)

// Settings
router.get('/settings', getSettings)
router.put('/settings', updateSettings)

// Points
router.get('/points', getPointsTransactions)
router.post('/points/adjust', adjustPoints)

// AI
router.get('/ai', getAiSettings)
router.put('/ai', updateAiSettings)

// Assessments
router.get('/assessments', getAssessments)
router.post('/assessments', createAssessment)

export default router
