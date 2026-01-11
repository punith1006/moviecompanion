import { Router } from 'express';
import {
    register,
    login,
    getMe,
    refreshToken,
    updateProfile,
    registerSchema,
    loginSchema,
} from '../controllers/authController';
import { authenticateToken, validateBody } from '../middleware';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, updateProfile);

export default router;
