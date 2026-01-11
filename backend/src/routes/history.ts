import { Router } from 'express';
import {
    getWatchHistory,
    addOrUpdateWatch,
    getWatchEntry,
    updateWatchEntry,
    deleteWatchEntry,
    addQuote,
    getAllQuotes,
    getStats,
    addWatchSchema,
    updateWatchSchema,
    addQuoteSchema,
} from '../controllers/watchHistoryController';
import { authenticateToken, validateBody } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Watch history CRUD
router.get('/', getWatchHistory);
router.post('/', validateBody(addWatchSchema), addOrUpdateWatch);
router.get('/stats', getStats);
router.get('/quotes', getAllQuotes);
router.get('/:id', getWatchEntry);
router.patch('/:id', validateBody(updateWatchSchema), updateWatchEntry);
router.delete('/:id', deleteWatchEntry);

// Quotes
router.post('/:id/quotes', validateBody(addQuoteSchema), addQuote);

export default router;
