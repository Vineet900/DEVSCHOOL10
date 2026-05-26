import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

// Controller Imports
import * as dashboardController from '../controllers/admin/dashboardController.js';
import * as usersController from '../controllers/admin/usersController.js';
import * as coursesController from '../controllers/admin/coursesController.js';
import * as sectionsController from '../controllers/admin/sectionsController.js';
import * as quizzesController from '../controllers/admin/quizzesController.js';
import * as analyticsController from '../controllers/admin/analyticsController.js';
import * as settingsController from '../controllers/admin/settingsController.js';
import * as pointsController from '../controllers/admin/pointsController.js';
import * as aiController from '../controllers/admin/aiController.js';
import * as assessmentsController from '../controllers/admin/assessmentsController.js';
import * as rewardsController from '../controllers/admin/rewardsController.js';
import * as notificationsController from '../controllers/admin/notificationsController.js';
import * as moderationController from '../controllers/admin/moderationController.js';
import * as logsController from '../controllers/admin/logsController.js';

const router = express.Router();

// Role authorization protection - All admin routes require ADMIN authorization
router.use(protect);
router.use(authorize('ADMIN'));

// 1. Dashboard Overview
router.get('/dashboard', dashboardController.getDashboardStats);
router.get('/stats', dashboardController.getDashboardStats);

// 2. User Management
router.get('/users', usersController.getUsers);
router.put('/users/:id', usersController.updateUser);
router.post('/users/:id/ban', usersController.banUser);

// 3. Course Management
router.get('/courses', coursesController.getCourses);
router.post('/courses', coursesController.createCourse);
router.put('/courses/:id', coursesController.updateCourse);
router.delete('/courses/:id', coursesController.deleteCourse);

// 4. Lesson Management
router.get('/courses/:courseId/lessons', coursesController.getLessons);
router.post('/courses/:courseId/lessons', coursesController.createLesson);
router.put('/lessons/:id', coursesController.updateLesson);
router.delete('/lessons/:id', coursesController.deleteLesson);

// 5. Chapter (Section) Management
router.get('/courses/:courseId/sections', sectionsController.getSections);
router.post('/courses/:courseId/sections', sectionsController.createSection);
router.put('/sections/:id', sectionsController.updateSection);
router.delete('/sections/:id', sectionsController.deleteSection);
router.post('/courses/:courseId/sections/bulk', sectionsController.bulkUploadSections);

// 6. Quiz Management
router.get('/quizzes', quizzesController.getQuizzes);
router.post('/quizzes', quizzesController.createQuiz);
router.put('/quizzes/:id', quizzesController.updateQuiz);
router.delete('/quizzes/:id', quizzesController.deleteQuiz);

// 7. Analytics Panel
router.get('/analytics', analyticsController.getAnalytics);

// 8. Settings Management
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

// 9. Study Points / Wallet Adjustment
router.get('/points', pointsController.getPointsTransactions);
router.post('/points/adjust', pointsController.adjustPoints);

// 10. AI Tutor Settings
router.get('/ai', aiController.getAiSettings);
router.put('/ai', aiController.updateAiSettings);

// 11. Assessments
router.get('/assessments', assessmentsController.getAssessments);
router.post('/assessments', assessmentsController.createAssessment);

// 12. Rewards Inventory & Redeem Requests
router.get('/rewards/redeem-requests', rewardsController.getRedeemRequests);
router.put('/rewards/redeem-requests/:id', rewardsController.updateRedeemStatus);
router.get('/rewards/coupons', rewardsController.getCoupons);
router.post('/rewards/coupons', rewardsController.createCoupon);
router.delete('/rewards/coupons/:id', rewardsController.deleteCoupon);

// 13. System Notifications
router.post('/notifications/send', notificationsController.sendNotification);

// 14. Content Moderation
router.get('/moderation/reports', moderationController.getModerationReports);
router.put('/moderation/reports/:id', moderationController.resolveModerationReport);
router.post('/moderation/delete-content', moderationController.deleteFlaggedContent);

// 15. Activity & Audit Logs
router.get('/logs', logsController.getDetailedLogs);

export default router;
