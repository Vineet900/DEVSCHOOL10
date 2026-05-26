import express from 'express';
import { 
  getUserRoadmaps, 
  createUserRoadmap, 
  updateUserRoadmap, 
  deleteUserRoadmap 
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/user', getUserRoadmaps);
router.post('/user', createUserRoadmap);
router.put('/user/:id', updateUserRoadmap);
router.delete('/user/:id', deleteUserRoadmap);

export default router;
