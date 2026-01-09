import { Router, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { authenticate, AuthRequest } from '../middleware';
import { WatchHistory } from '../models';

const router = Router();

// POST /api/ai/chat - Proxy chat requests to AI service
router.post('/chat', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { message } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        // Fetch user's watch history for context
        const history = await WatchHistory.find({ userId })
            .select('contentId contentType title status rating')
            .lean();

        // Forward to AI service
        const response = await fetch(`${config.aiServiceUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                history,
                preferences: {}, // TODO: Fetch from user preferences
            }),
        });

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        // Fallback response if AI service is down
        console.error('AI service error:', error);
        res.status(200).json({
            response: "I'm having trouble connecting right now. In the meantime, try browsing our popular picks or searching for something specific!",
            recommendations: [],
        });
    }
});

// POST /api/ai/recap - Proxy recap requests to AI service
router.post('/recap', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { showId, currentSeason, currentEpisode } = req.body;

        if (!showId || !currentSeason || !currentEpisode) {
            res.status(400).json({ error: 'showId, currentSeason, and currentEpisode are required' });
            return;
        }

        const response = await fetch(`${config.aiServiceUrl}/api/recap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showId, currentSeason, currentEpisode }),
        });

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('AI recap error:', error);
        res.status(200).json({
            showTitle: 'Unknown Show',
            tldr: 'Unable to generate recap at this time.',
            fullRecap: 'Please try again later.',
        });
    }
});

// POST /api/ai/quiz - Proxy quiz requests to AI service
router.post('/quiz', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { contentId, contentType } = req.body;

        if (!contentId || !contentType) {
            res.status(400).json({ error: 'contentId and contentType are required' });
            return;
        }

        const response = await fetch(`${config.aiServiceUrl}/api/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentId, contentType }),
        });

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('AI quiz error:', error);
        res.status(500).json({ error: 'Unable to generate quiz at this time.' });
    }
});

export default router;
