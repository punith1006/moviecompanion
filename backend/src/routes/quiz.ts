import { Router } from 'express';
import { submitQuiz, getCompletedQuizzes } from '../controllers/quizController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get completed quizzes
router.get('/completed', authenticateToken, getCompletedQuizzes);

// Submit quiz results
router.post('/submit', authenticateToken, submitQuiz);

export default router;
