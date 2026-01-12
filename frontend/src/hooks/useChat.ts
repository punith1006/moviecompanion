import { useState, useCallback } from 'react';
import { api, ContentItem } from '@/lib/api';

export interface SuggestedReply {
    label: string;
    icon: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: {
        type?: 'text' | 'recap' | 'recommendation' | 'quiz' | 'discovery';
        toolsUsed?: string[];
        showId?: string;
        contentCards?: ContentItem[];
        suggestedReplies?: SuggestedReply[];
    };
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Optimistically add user message
        const tempId = Date.now().toString();
        const userMessage: Message = {
            id: tempId,
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Send to API
            const response = await api.sendMessage(content, conversationId);

            if (!response.success || !response.data) {
                throw new Error("Failed to send message: " + response.error);
            }

            const data = response.data;

            // Update conversation ID if new
            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            // Add AI response
            const aiMessage: Message = {
                id: Date.now().toString(), // Or ID from backend if provided
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toISOString(),
                metadata: {
                    type: data.type as 'text' | 'recap' | 'recommendation' | 'quiz' | 'discovery',
                    toolsUsed: data.metadata?.toolsUsed as string[] | undefined,
                    showId: data.metadata?.showId as string | undefined,
                    contentCards: data.metadata?.contentCards as ContentItem[] | undefined,
                    suggestedReplies: data.metadata?.suggestedReplies as SuggestedReply[] | undefined,
                }
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err: any) {
            console.error('Chat error:', err);
            setError('Failed to send message. Please try again.');
            // Optionally remove user message on failure
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    return {
        messages,
        sendMessage,
        isLoading,
        error,
        conversationId
    };
}
