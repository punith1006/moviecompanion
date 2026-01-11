import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import historyRoutes from './history';
import chatRoutes from './chat';
import contentRoutes from './content';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'reelmind-backend',
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/chat', chatRoutes);
router.use('/content', contentRoutes);

export default router;
