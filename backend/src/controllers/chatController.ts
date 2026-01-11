import { Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config/environment';
import { AppError, AuthRequest } from '../middleware';
import { WatchHistory, Conversation } from '../models';

// Validation schemas
export const chatSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    conversationId: z.string().optional(),
});

// Send message to AI agent
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { message, conversationId } = req.body;
        const userId = req.user!._id.toString();

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                userId: req.user!._id,
                isActive: true,
            });
        }

        if (!conversation) {
            conversation = await Conversation.create({
                userId: req.user!._id,
                messages: [],
                isActive: true,
                lastInteractionAt: new Date(),
            });
        }

        // Add user message to conversation
        conversation.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date(),
        });

        // Get user's watch history for context
        const watchHistory = await WatchHistory.find({ userId: req.user!._id })
            .select('title tmdbId status progress rating genres platform savedQuotes')
            .lean();

        // Call AI service
        let aiResponse;
        try {
            const response = await axios.post(
                `${config.aiServiceUrl}/chat`,
                {
                    message,
                    userId,
                    conversationId: conversation._id.toString(),
                    context: {
                        watchHistory: watchHistory.map(h => ({
                            title: h.title,
                            tmdbId: h.tmdbId,
                            status: h.status,
                            progress: h.progress,
                            rating: h.rating,
                            genres: h.genres,
                            platform: h.platform,
                            quotesCount: h.savedQuotes?.length || 0,
                        })),
                        userName: req.user!.name,
                        userStats: req.user!.stats,
                        preferences: req.user!.preferences,
                    },
                    conversationHistory: conversation.messages.slice(-10), // Last 10 messages
                },
                {
                    timeout: 30000, // 30 second timeout
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            aiResponse = response.data;
        } catch (aiError) {
            console.error('AI Service error:', aiError);
            aiResponse = {
                response: "I'm having trouble processing your request right now. Please try again in a moment.",
                type: 'text',
                metadata: {},
            };
        }

        // Add AI response to conversation
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse.response,
            timestamp: new Date(),
            metadata: {
                type: aiResponse.type || 'text',
                toolsUsed: aiResponse.toolsUsed || [],
                showId: aiResponse.showId,
            },
        });

        conversation.lastInteractionAt = new Date();
        await conversation.save();

        res.json({
            success: true,
            data: {
                response: aiResponse.response,
                type: aiResponse.type || 'text',
                conversationId: conversation._id,
                metadata: aiResponse.metadata || {},
            },
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

// Get conversation history
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findOne({
            _id: id,
            userId: req.user!._id,
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        res.json({
            success: true,
            data: { conversation },
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

// Get all conversations
export async function getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
        const conversations = await Conversation.find({ userId: req.user!._id })
            .select('_id isActive lastInteractionAt createdAt')
            .sort({ lastInteractionAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: { conversations },
        });
    } catch (error) {
        throw error;
    }
}

// Start new conversation
export async function newConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        // Mark all existing conversations as inactive
        await Conversation.updateMany(
            { userId: req.user!._id, isActive: true },
            { isActive: false }
        );

        const conversation = await Conversation.create({
            userId: req.user!._id,
            messages: [{
                role: 'assistant',
                content: `Hey ${req.user!.name}! I'm ReelMind, your personal entertainment companion. 🎬 I remember everything you watch. Tell me something you've seen recently, or ask me for recommendations!`,
                timestamp: new Date(),
                metadata: { type: 'text' },
            }],
            isActive: true,
            lastInteractionAt: new Date(),
        });

        res.status(201).json({
            success: true,
            data: { conversation },
        });
    } catch (error) {
        throw error;
    }
}

// Delete conversation
export async function deleteConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const conversation = await Conversation.findOneAndDelete({
            _id: id,
            userId: req.user!._id,
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        res.json({
            success: true,
            message: 'Conversation deleted',
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
