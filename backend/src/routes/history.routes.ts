import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { WatchHistory } from '../models';
import { authenticate, AuthRequest } from '../middleware';

const router = Router();

// Validation schemas
const createHistorySchema = z.object({
    contentId: z.string().min(1),
    contentType: z.enum(['movie', 'tv']),
    status: z.enum(['watched', 'watching', 'dropped', 'not_interested']),
    rating: z.number().min(1).max(10).optional(),
    episodeProgress: z.object({
        season: z.number().min(1),
        episode: z.number().min(1),
    }).optional(),
    title: z.string().min(1),
    posterPath: z.string().optional(),
    genres: z.array(z.string()).optional(),
});

const updateHistorySchema = createHistorySchema.partial();

// GET /api/history - Get user's watch history
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { status, page = '1', limit = '20', genre } = req.query;
        const userId = req.user?.userId;

        const query: Record<string, unknown> = { userId };

        if (status && typeof status === 'string') {
            query.status = status;
        }

        if (genre && typeof genre === 'string') {
            query.genres = { $in: [genre] };
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            WatchHistory.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            WatchHistory.countDocuments(query),
        ]);

        res.status(200).json({
            items,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/history - Add to watch history
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validation = createHistorySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const userId = req.user?.userId;
        const data = validation.data;

        // Upsert - update if exists, create if not
        const item = await WatchHistory.findOneAndUpdate(
            { userId, contentId: data.contentId },
            { ...data, userId },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
});

// PUT /api/history/:id - Update history item
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const validation = updateHistorySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const userId = req.user?.userId;
        const { id } = req.params;

        const item = await WatchHistory.findOneAndUpdate(
            { _id: id, userId },
            validation.data,
            { new: true }
        );

        if (!item) {
            res.status(404).json({ error: 'History item not found' });
            return;
        }

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/history/:id - Remove from history
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const item = await WatchHistory.findOneAndDelete({ _id: id, userId });

        if (!item) {
            res.status(404).json({ error: 'History item not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
