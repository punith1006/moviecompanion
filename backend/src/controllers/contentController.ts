import { Request, Response } from 'express';
import { z } from 'zod';
import { tmdbService } from '../services/tmdbService';
import { aiService } from '../services/aiService';

const discoverSchema = z.object({
    type: z.enum(['Movies', 'Series', 'All']).default('Movies'),
    sortBy: z.enum(['Popular', 'Top', 'Top Rated', 'Latest', 'Trending']).default('Popular'),
    genre: z.string().default('All'),
    page: z.coerce.number().min(1).default(1),
    query: z.string().optional(),
});

export const discoverContent = async (req: Request, res: Response) => {
    try {
        const params = discoverSchema.parse(req.query);

        // Map frontend type to TMDB type
        const tmdbType = params.type === 'Series' ? 'tv' : 'movie';

        // If type is 'All', we need to fetch both and merge
        if (params.type === 'All') {
            const [movies, series] = await Promise.all([
                tmdbService.discoverContent({
                    type: 'movie',
                    sortBy: params.sortBy,
                    genre: params.genre,
                    page: params.page,
                    query: params.query,
                }),
                tmdbService.discoverContent({
                    type: 'tv',
                    sortBy: params.sortBy,
                    genre: params.genre,
                    page: params.page,
                    query: params.query,
                }),
            ]);

            // Interleave results - explicitly type the array
            type ContentItem = typeof movies.results[number];
            const combined: ContentItem[] = [];
            const maxLen = Math.max(movies.results.length, series.results.length);
            for (let i = 0; i < maxLen; i++) {
                if (i < movies.results.length) combined.push(movies.results[i]);
                if (i < series.results.length) combined.push(series.results[i]);
            }

            return res.json({
                success: true,
                data: {
                    results: combined,
                    totalPages: Math.max(movies.totalPages, series.totalPages),
                    totalResults: movies.totalResults + series.totalResults,
                    page: params.page,
                },
            });
        }

        const data = await tmdbService.discoverContent({
            type: tmdbType,
            sortBy: params.sortBy,
            genre: params.genre,
            page: params.page,
            query: params.query,
        });

        res.json({
            success: true,
            data: {
                ...data,
                page: params.page,
            },
        });
    } catch (error: any) {
        console.error('Discover content error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch content',
        });
    }
};

export const getContentDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        if (!id || !type) {
            return res.status(400).json({
                success: false,
                error: 'Missing id or type parameter',
            });
        }

        const tmdbType = type === 'series' ? 'tv' : 'movie';
        const data = await tmdbService.getContentDetails(parseInt(id), tmdbType);

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('Get content details error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch content details',
        });
    }
};

export const getTrending = async (req: Request, res: Response) => {
    try {
        const mediaType = (req.query.mediaType as 'movie' | 'tv' | 'all') || 'all';
        const timeWindow = (req.query.timeWindow as 'day' | 'week') || 'week';

        const data = await tmdbService.getTrending(mediaType, timeWindow);

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('Get trending error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch trending content',
        });
    }
};

export const searchContent = async (req: Request, res: Response) => {
    try {
        const { query, type = 'movie', page = '1' } = req.query;
        const pageNum = parseInt(page as string);

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Missing search query',
            });
        }

        if (type === 'all') {
            const [movies, series] = await Promise.all([
                tmdbService.searchContent(query, 'movie', pageNum),
                tmdbService.searchContent(query, 'tv', pageNum),
            ]);

            // Interleave results
            type ContentItem = typeof movies.results[number];
            const combined: ContentItem[] = [];
            const maxLen = Math.max(movies.results.length, series.results.length);
            for (let i = 0; i < maxLen; i++) {
                if (i < movies.results.length) combined.push(movies.results[i]);
                if (i < series.results.length) combined.push(series.results[i]);
            }

            return res.json({
                success: true,
                data: {
                    results: combined,
                    totalPages: Math.max(movies.totalPages, series.totalPages),
                    totalResults: movies.totalResults + series.totalResults,
                    page: pageNum,
                },
            });
        }

        const tmdbType = type === 'series' ? 'tv' : 'movie';
        const data = await tmdbService.searchContent(query, tmdbType as 'movie' | 'tv', pageNum);

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('Search content error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search content',
        });
    }
};

export const aiSearch = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: 'Query required' });
        }

        const result = await aiService.getSemanticRecommendations(query);

        if (!result.success) {
            throw new Error(result.error);
        }

        const mappedResults = result.results.map((item: any) => ({
            id: item.id,
            title: item.title,
            overview: item.overview,
            posterUrl: item.poster_url || item.posterUrl,
            backdropUrl: item.backdrop_url || item.backdropUrl || null,
            rating: item.rating,
            year: item.year || '',
            type: item.type === 'movie' ? 'movie' : 'series',
            genres: item.genres || [],
        }));

        res.json({
            success: true,
            data: {
                results: mappedResults,
                totalPages: 1,
                totalResults: mappedResults.length,
                page: 1
            }
        });

    } catch (error: any) {
        console.error('AI Search Error:', error);
        res.status(500).json({ success: false, error: error.message || 'AI Search failed' });
    }
};
