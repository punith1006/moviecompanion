import { Router } from 'express';
import authRoutes from './auth.routes';
import historyRoutes from './history.routes';
import watchlistRoutes from './watchlist.routes';
import contentRoutes from './content.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'CinePal Backend API',
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/content', contentRoutes);
router.use('/ai', aiRoutes);

export default router;
