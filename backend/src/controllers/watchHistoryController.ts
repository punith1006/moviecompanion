import { Response } from 'express';
import { z } from 'zod';
import { WatchHistory, User } from '../models';
import { AppError, AuthRequest } from '../middleware';

const GENRE_MAP: Record<string, string> = {
    '28': 'Action',
    '12': 'Adventure',
    '16': 'Animation',
    '35': 'Comedy',
    '80': 'Crime',
    '99': 'Documentary',
    '18': 'Drama',
    '10751': 'Family',
    '14': 'Fantasy',
    '36': 'History',
    '27': 'Horror',
    '10402': 'Music',
    '9648': 'Mystery',
    '10749': 'Romance',
    '878': 'Science Fiction',
    '10770': 'TV Movie',
    '53': 'Thriller',
    '10752': 'War',
    '37': 'Western',
    '10759': 'Action & Adventure',
    '10762': 'Kids',
    '10763': 'News',
    '10764': 'Reality',
    '10765': 'Sci-Fi & Fantasy',
    '10766': 'Soap',
    '10767': 'Talk',
    '10768': 'War & Politics',
};

// Validation schemas
export const addWatchSchema = z.object({
    tmdbId: z.number(),
    title: z.string(),
    type: z.enum(['movie', 'series']),
    platform: z.string(),
    status: z.enum(['watching', 'completed', 'dropped', 'want_to_watch']).optional(),
    progress: z.object({
        season: z.number().optional(),
        episode: z.number().optional(),
        percentage: z.number().optional(),
    }).optional(),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().max(1000).optional(),
    genres: z.array(z.string()).optional(),
    posterUrl: z.string().optional(),
    backdropUrl: z.string().optional(),
});

export const updateWatchSchema = z.object({
    status: z.enum(['watching', 'completed', 'dropped', 'want_to_watch']).optional(),
    progress: z.object({
        season: z.number().optional(),
        episode: z.number().optional(),
        percentage: z.number().optional(),
    }).optional(),
    rating: z.number().min(1).max(5).optional(),
    notes: z.string().max(1000).optional(),
});

export const addQuoteSchema = z.object({
    quote: z.string().min(1),
    character: z.string().min(1),
    season: z.number().optional(),
    episode: z.number().optional(),
});

// Get user's watch history
export async function getWatchHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { status, type, sort = 'lastWatchedAt', order = 'desc' } = req.query;

        const query: Record<string, unknown> = { userId: req.user!._id };
        if (status) query.status = status;
        if (type) query.type = type;

        const sortOption: Record<string, 1 | -1> = {
            [sort as string]: order === 'asc' ? 1 : -1,
        };

        const history = await WatchHistory.find(query)
            .sort(sortOption)
            .lean();

        res.json({
            success: true,
            data: {
                items: history,
                total: history.length,
            },
        });
    } catch (error) {
        throw error;
    }
}

// Add or update watch entry
export async function addOrUpdateWatch(req: AuthRequest, res: Response): Promise<void> {
    try {
        const data = req.body;

        const existing = await WatchHistory.findOne({
            userId: req.user!._id,
            tmdbId: data.tmdbId,
        });

        if (existing) {
            // Update existing entry
            Object.assign(existing, {
                ...data,
                lastWatchedAt: new Date(),
            });
            await existing.save();

            res.json({
                success: true,
                data: { entry: existing, created: false },
            });
        } else {
            // Create new entry
            const entry = await WatchHistory.create({
                userId: req.user!._id,
                ...data,
                savedQuotes: [],
                firstWatchedAt: new Date(),
                lastWatchedAt: new Date(),
            });

            // Update user stats
            await User.findByIdAndUpdate(req.user!._id, {
                $inc: { 'stats.showsWatched': 1 },
            });

            res.status(201).json({
                success: true,
                data: { entry, created: true },
            });
        }
    } catch (error) {
        throw error;
    }
}

// Get single watch entry
export async function getWatchEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const entry = await WatchHistory.findOne({
            _id: id,
            userId: req.user!._id,
        });

        if (!entry) {
            throw new AppError('Watch entry not found', 404);
        }

        res.json({
            success: true,
            data: { entry },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Update watch entry
export async function updateWatchEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        const entry = await WatchHistory.findOneAndUpdate(
            { _id: id, userId: req.user!._id },
            { $set: { ...updates, lastWatchedAt: new Date() } },
            { new: true }
        );

        if (!entry) {
            throw new AppError('Watch entry not found', 404);
        }

        res.json({
            success: true,
            data: { entry },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Delete watch entry
export async function deleteWatchEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const entry = await WatchHistory.findOneAndDelete({
            _id: id,
            userId: req.user!._id,
        });

        if (!entry) {
            throw new AppError('Watch entry not found', 404);
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user!._id, {
            $inc: { 'stats.showsWatched': -1 },
        });

        res.json({
            success: true,
            message: 'Entry deleted successfully',
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Add quote to watch entry
export async function addQuote(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const quoteData = req.body;

        const entry = await WatchHistory.findOneAndUpdate(
            { _id: id, userId: req.user!._id },
            {
                $push: {
                    savedQuotes: {
                        ...quoteData,
                        addedAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!entry) {
            throw new AppError('Watch entry not found', 404);
        }

        res.status(201).json({
            success: true,
            data: { entry },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Get user's saved quotes
export async function getAllQuotes(req: AuthRequest, res: Response): Promise<void> {
    try {
        const entries = await WatchHistory.find({
            userId: req.user!._id,
            'savedQuotes.0': { $exists: true },
        }).select('title tmdbId savedQuotes');

        const quotes = entries.flatMap((entry) =>
            entry.savedQuotes.map((q) => ({
                ...q,
                showTitle: entry.title,
                showId: entry.tmdbId,
            }))
        );

        res.json({
            success: true,
            data: { quotes },
        });
    } catch (error) {
        throw error;
    }
}

// Get watch statistics
export async function getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!._id;

        const [
            totalCompleted,
            totalWatching,
            totalWantToWatch,
            genreStats,
            platformStats,
        ] = await Promise.all([
            WatchHistory.countDocuments({ userId, status: 'completed' }),
            WatchHistory.countDocuments({ userId, status: 'watching' }),
            WatchHistory.countDocuments({ userId, status: 'want_to_watch' }),
            WatchHistory.aggregate([
                { $match: { userId } },
                { $unwind: '$genres' },
                { $group: { _id: '$genres', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            WatchHistory.aggregate([
                { $match: { userId } },
                { $group: { _id: '$platform', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    completed: totalCompleted,
                    watching: totalWatching,
                    wantToWatch: totalWantToWatch,
                    total: totalCompleted + totalWatching + totalWantToWatch,
                },
                topGenres: genreStats.map((g) => ({
                    genre: GENRE_MAP[String(g._id)] || String(g._id),
                    count: g.count
                })),
                platforms: platformStats.map((p) => ({ platform: p._id, count: p.count })),
                userStats: req.user!.stats,
            },
        });
    } catch (error) {
        throw error;
    }
}
