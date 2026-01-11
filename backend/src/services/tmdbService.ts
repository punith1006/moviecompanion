import axios from 'axios';
import { config } from '../config/environment';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TMDBContent {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    genre_ids: number[];
    popularity: number;
    media_type?: string;
}

interface TMDBDiscoverResponse {
    page: number;
    results: TMDBContent[];
    total_pages: number;
    total_results: number;
}

// Genre mappings for TMDB
const MOVIE_GENRES: Record<string, number> = {
    'Action': 28,
    'Adventure': 12,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 14,
    'History': 36,
    'Horror': 27,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Sci-Fi': 878,
    'Thriller': 53,
    'War': 10752,
    'Western': 37,
};

const TV_GENRES: Record<string, number> = {
    'Action': 10759,
    'Adventure': 10759,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 10765,
    'History': 36,
    'Horror': 9648,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Sci-Fi': 10765,
    'Thriller': 80,
    'War': 10768,
    'Western': 37,
};

// Reverse mapping helper
const getGenreName = (id: number, type: 'movie' | 'tv'): string => {
    const map = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
    return Object.keys(map).find(key => map[key] === id) || '';
};

export class TMDBService {
    private apiKey: string;

    constructor() {
        this.apiKey = config.tmdbApiKey;
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
        const url = `${TMDB_BASE_URL}${endpoint}`;
        const response = await axios.get<T>(url, {
            params: {
                api_key: this.apiKey,
                ...params,
            },
        });
        return response.data;
    }

    async discoverContent(options: {
        type: 'movie' | 'tv';
        sortBy: string;
        genre?: string;
        page?: number;
        query?: string;
    }): Promise<{
        results: Array<{
            id: number;
            title: string;
            overview: string;
            posterUrl: string | null;
            backdropUrl: string | null;
            rating: number;
            year: string;
            type: 'movie' | 'series';
            genres: string[];
        }>;
        totalPages: number;
        totalResults: number;
    }> {
        const { type, sortBy, genre, page = 1, query } = options;

        // If there's a search query, use search endpoint
        if (query && query.trim()) {
            return this.searchContent(query, type, page);
        }

        // Map sortBy to TMDB sort parameters
        const sortMapping: Record<string, string> = {
            'Popular': 'popularity.desc',
            'Top Rated': 'vote_average.desc',
            'Top': 'vote_average.desc',
            'Latest': 'primary_release_date.desc',
            'Trending': 'popularity.desc',
        };

        const tmdbSort = sortMapping[sortBy] || 'popularity.desc';

        // Get genre ID
        const genreMap = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
        const genreId = genre && genre !== 'All' ? genreMap[genre] : undefined;

        // Build params
        const params: Record<string, string | number> = {
            sort_by: tmdbSort,
            page,
            include_adult: 'false',
            'vote_count.gte': sortBy === 'Top' || sortBy === 'Top Rated' ? 200 : 0,
        };

        if (genreId) {
            params.with_genres = genreId;
        }

        const endpoint = `/discover/${type}`;
        const data = await this.makeRequest<TMDBDiscoverResponse>(endpoint, params);

        return {
            results: data.results.map((item) => ({
                id: item.id,
                title: type === 'movie' ? item.title || '' : item.name || '',
                overview: item.overview,
                posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
                backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                rating: Math.round(item.vote_average * 10) / 10,
                year: (type === 'movie' ? item.release_date : item.first_air_date)?.split('-')[0] || '',
                type: type === 'movie' ? 'movie' as const : 'series' as const,
                genres: (item.genre_ids || []).map(id => getGenreName(id, type)).filter(g => g),
            })),
            totalPages: data.total_pages,
            totalResults: data.total_results,
        };
    }

    async searchContent(query: string, type: 'movie' | 'tv', page: number = 1) {
        const endpoint = `/search/${type}`;
        const data = await this.makeRequest<TMDBDiscoverResponse>(endpoint, {
            query,
            page,
            include_adult: 'false',
        });

        return {
            results: data.results
                .filter(item => (item.vote_average || 0) >= 5)
                .map((item) => ({
                    id: item.id,
                    title: type === 'movie' ? item.title || '' : item.name || '',
                    overview: item.overview,
                    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
                    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                    rating: Math.round(item.vote_average * 10) / 10,
                    year: (type === 'movie' ? item.release_date : item.first_air_date)?.split('-')[0] || '',
                    type: type === 'movie' ? 'movie' as const : 'series' as const,
                    genres: (item.genre_ids || []).map(id => getGenreName(id, type)).filter(g => g),
                })),
            totalPages: data.total_pages,
            totalResults: data.total_results,
        };
    }

    async getContentDetails(id: number, type: 'movie' | 'tv') {
        const endpoint = `/${type}/${id}`;
        const data = await this.makeRequest<any>(endpoint, {
            append_to_response: 'credits',
        });

        const directors = type === 'movie'
            ? data.credits?.crew?.filter((c: any) => c.job === 'Director').map((c: any) => c.name) || []
            : data.created_by?.map((c: any) => c.name) || [];

        const cast = data.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];

        return {
            id: data.id,
            title: type === 'movie' ? data.title : data.name,
            overview: data.overview,
            posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null,
            backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            rating: Math.round(data.vote_average * 10) / 10,
            year: (type === 'movie' ? data.release_date : data.first_air_date)?.split('-')[0] || '',
            runtime: type === 'movie' ? data.runtime : data.episode_run_time?.[0] || null,
            genres: data.genres?.map((g: any) => g.name) || [],
            directors,
            cast,
            type: type === 'movie' ? 'movie' as const : 'series' as const,
        };
    }

    async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
        const endpoint = `/trending/${mediaType}/${timeWindow}`;
        const data = await this.makeRequest<TMDBDiscoverResponse>(endpoint);

        return {
            results: data.results.map((item) => {
                const isMovie = item.media_type === 'movie' || (!item.name && item.title);
                const type = isMovie ? 'movie' as const : 'series' as const;
                const tmdbType = isMovie ? 'movie' : 'tv';
                return {
                    id: item.id,
                    title: isMovie ? item.title || '' : item.name || '',
                    overview: item.overview,
                    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
                    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                    rating: Math.round(item.vote_average * 10) / 10,
                    year: (isMovie ? item.release_date : item.first_air_date)?.split('-')[0] || '',
                    type,
                    genres: (item.genre_ids || []).map(id => getGenreName(id, tmdbType)).filter(g => g),
                };
            }),
            totalPages: data.total_pages,
            totalResults: data.total_results,
        };
    }
}

export const tmdbService = new TMDBService();
