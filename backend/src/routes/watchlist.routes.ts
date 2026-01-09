import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Watchlist } from '../models';
import { authenticate, AuthRequest } from '../middleware';

const router = Router();

// Validation schemas
const createWatchlistSchema = z.object({
    contentId: z.string().min(1),
    contentType: z.enum(['movie', 'tv']),
    priority: z.enum(['must_watch', 'interested', 'maybe']).default('interested'),
    title: z.string().min(1),
    posterPath: z.string().optional(),
});

// GET /api/watchlist - Get user's watchlist
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { priority } = req.query;

        const query: Record<string, unknown> = { userId };

        if (priority && typeof priority === 'string') {
            query.priority = priority;
        }

        const items = await Watchlist.find(query)
            .sort({ priority: 1, createdAt: -1 })
            .lean();

        res.status(200).json({ items });
    } catch (error) {
        next(error);
    }
});

// POST /api/watchlist - Add to watchlist
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validation = createWatchlistSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const userId = req.user?.userId;
        const data = validation.data;

        // Check if already exists
        const existing = await Watchlist.findOne({ userId, contentId: data.contentId });
        if (existing) {
            res.status(409).json({ error: 'Item already in watchlist' });
            return;
        }

        const item = new Watchlist({ ...data, userId });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
});

// PUT /api/watchlist/:id - Update watchlist item priority
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { priority } = req.body;

        if (!priority || !['must_watch', 'interested', 'maybe'].includes(priority)) {
            res.status(400).json({ error: 'Invalid priority' });
            return;
        }

        const userId = req.user?.userId;
        const { id } = req.params;

        const item = await Watchlist.findOneAndUpdate(
            { _id: id, userId },
            { priority },
            { new: true }
        );

        if (!item) {
            res.status(404).json({ error: 'Watchlist item not found' });
            return;
        }

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/watchlist/:id - Remove from watchlist
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const item = await Watchlist.findOneAndDelete({ _id: id, userId });

        if (!item) {
            res.status(404).json({ error: 'Watchlist item not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
