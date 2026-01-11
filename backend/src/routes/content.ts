import { Router } from 'express';
import {
    discoverContent,
    getContentDetails,
    getTrending,
    searchContent,
    aiSearch,
} from '../controllers/contentController';

const router = Router();

// GET /api/content/discover - Discover movies/series with filters
router.get('/discover', discoverContent);

// GET /api/content/trending - Get trending content
router.get('/trending', getTrending);

// GET /api/content/search - Search for content
router.get('/search', searchContent);

// POST /api/content/ai-search - Semantic search
router.post('/ai-search', aiSearch);

// GET /api/content/:id - Get content details
router.get('/:id', getContentDetails);

export default router;
