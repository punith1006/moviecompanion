import { Router } from 'express';
import {
    sendMessage,
    getConversation,
    getConversations,
    getHistory,
    clearHistory,
    newConversation,
    deleteConversation,
    chatSchema,
} from '../controllers/chatController';
import { authenticateToken, validateBody } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Conversation management
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.get('/conversations', getConversations);
router.post('/conversations', newConversation);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

// Chat
router.post('/message', validateBody(chatSchema), sendMessage);

export default router;
