import { Router, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { authenticate, AuthRequest } from '../middleware';

const router = Router();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to fetch from TMDb
async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${config.tmdbApiKey}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status}`);
    }

    return response.json();
}

// GET /api/content/search - Search for movies/TV shows
router.get('/search', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { q, type = 'multi', page = '1' } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Query parameter "q" is required' });
            return;
        }

        // If no TMDb API key, return sample data for demo
        if (!config.tmdbApiKey) {
            res.status(200).json({
                results: getSampleSearchResults(q),
                page: 1,
                total_results: 3,
                total_pages: 1,
            });
            return;
        }

        const endpoint = type === 'movie' ? '/search/movie' :
            type === 'tv' ? '/search/tv' : '/search/multi';

        const data = await tmdbFetch(endpoint, {
            query: q,
            page: page as string,
        });

        // Transform results to our format
        const results = data.results.map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title || item.name,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            overview: item.overview,
            releaseDate: item.release_date || item.first_air_date,
            voteAverage: item.vote_average,
            contentType: item.media_type || (item.title ? 'movie' : 'tv'),
            genres: item.genre_ids,
        }));

        res.status(200).json({
            results,
            page: data.page,
            total_results: data.total_results,
            total_pages: data.total_pages,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/content/:type/:id - Get content details
router.get('/:type/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { type, id } = req.params;

        if (!['movie', 'tv'].includes(type)) {
            res.status(400).json({ error: 'Type must be "movie" or "tv"' });
            return;
        }

        // If no TMDb API key, return sample data
        if (!config.tmdbApiKey) {
            res.status(200).json(getSampleContentDetails(type, id));
            return;
        }

        const data = await tmdbFetch(`/${type}/${id}`, {
            append_to_response: 'credits,videos',
        });

        res.status(200).json({
            id: data.id,
            title: data.title || data.name,
            posterPath: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            backdropPath: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            overview: data.overview,
            releaseDate: data.release_date || data.first_air_date,
            voteAverage: data.vote_average,
            runtime: data.runtime || data.episode_run_time?.[0],
            genres: data.genres?.map((g: { name: string }) => g.name) || [],
            cast: data.credits?.cast?.slice(0, 10) || [],
            contentType: type,
            seasons: data.number_of_seasons,
            episodes: data.number_of_episodes,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/content/:type/:id/availability - Get streaming availability
router.get('/:type/:id/availability', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { type, id } = req.params;
        const { region = 'US' } = req.query;

        // If no TMDb API key, return sample data
        if (!config.tmdbApiKey) {
            res.status(200).json({
                providers: [
                    { name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg', type: 'stream' },
                    { name: 'Amazon Prime', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg', type: 'stream' },
                ],
            });
            return;
        }

        const data = await tmdbFetch(`/${type}/${id}/watch/providers`);
        const regionData = data.results?.[region as string];

        const providers = [
            ...(regionData?.flatrate || []).map((p: Record<string, unknown>) => ({ ...p, type: 'stream' })),
            ...(regionData?.rent || []).map((p: Record<string, unknown>) => ({ ...p, type: 'rent' })),
            ...(regionData?.buy || []).map((p: Record<string, unknown>) => ({ ...p, type: 'buy' })),
        ];

        res.status(200).json({ providers });
    } catch (error) {
        next(error);
    }
});

// Sample data for demo when TMDb key is not set
function getSampleSearchResults(query: string) {
    return [
        {
            id: 550,
            title: 'Fight Club',
            posterPath: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.',
            releaseDate: '1999-10-15',
            voteAverage: 8.4,
            contentType: 'movie',
        },
        {
            id: 1396,
            title: 'Breaking Bad',
            posterPath: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
            overview: 'A chemistry teacher diagnosed with cancer turns to manufacturing meth.',
            releaseDate: '2008-01-20',
            voteAverage: 9.5,
            contentType: 'tv',
        },
        {
            id: 680,
            title: 'Pulp Fiction',
            posterPath: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
            overview: 'The lives of two mob hitmen intertwine in four tales of violence and redemption.',
            releaseDate: '1994-09-10',
            voteAverage: 8.5,
            contentType: 'movie',
        },
    ];
}

function getSampleContentDetails(type: string, id: string) {
    return {
        id: parseInt(id),
        title: type === 'movie' ? 'Sample Movie' : 'Sample TV Show',
        posterPath: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdropPath: null,
        overview: 'This is a sample content item for demonstration purposes.',
        releaseDate: '2024-01-01',
        voteAverage: 8.0,
        runtime: 120,
        genres: ['Drama', 'Thriller'],
        cast: [],
        contentType: type,
        seasons: type === 'tv' ? 3 : undefined,
        episodes: type === 'tv' ? 30 : undefined,
    };
}

export default router;
