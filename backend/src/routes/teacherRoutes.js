import express from 'express';
import {
  askTeacher,
  generateQuiz,
  generateRoadmap,
  explainCode,
  dailyStudyPlan,
  studySummary
} from '../controllers/teacherController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/teacher', protect, askTeacher);
router.post('/generateQuiz', protect, generateQuiz);
router.post('/generateRoadmap', protect, generateRoadmap);
router.post('/explainCode', protect, explainCode);
router.post('/dailyStudyPlan', protect, dailyStudyPlan);
router.post('/studySummary', protect, studySummary);

export default router;
