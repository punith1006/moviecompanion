import { create } from 'zustand';
import { api, Message } from '../api';

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    conversationId: string | null;
    error: string | null;

    // Actions
    sendMessage: (content: string) => Promise<void>;
    loadConversation: (conversationId: string) => Promise<void>;
    startNewConversation: () => Promise<void>;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [
        {
            role: 'assistant',
            content: "Hey! 👋 I'm ReelMind, your personal entertainment companion. I remember everything you watch and can help you with recaps, recommendations, and trivia. What would you like to do?",
            timestamp: new Date().toISOString(),
        },
    ],
    isLoading: false,
    conversationId: null,
    error: null,

    sendMessage: async (content: string) => {
        const { conversationId } = get();

        // Add user message immediately
        const userMessage: Message = {
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };

        set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
            error: null,
        }));

        try {
            const result = await api.sendMessage(content, conversationId || undefined);

            if (result.success && result.data) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: result.data.response,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        type: result.data.type,
                    },
                };

                set((state) => ({
                    messages: [...state.messages, assistantMessage],
                    conversationId: result.data?.conversationId || state.conversationId,
                    isLoading: false,
                }));
            } else {
                throw new Error(result.error || 'Failed to get response');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong';

            const errorResponse: Message = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                timestamp: new Date().toISOString(),
            };

            set((state) => ({
                messages: [...state.messages, errorResponse],
                isLoading: false,
                error: errorMessage,
            }));
        }
    },

    loadConversation: async (conversationId: string) => {
        set({ isLoading: true });

        const result = await api.getConversation(conversationId);

        if (result.success && result.data?.conversation.messages) {
            set({
                messages: result.data.conversation.messages,
                conversationId,
                isLoading: false,
            });
        } else {
            set({ isLoading: false, error: 'Failed to load conversation' });
        }
    },

    startNewConversation: async () => {
        set({ isLoading: true });

        const result = await api.newConversation();

        if (result.success && result.data) {
            set({
                messages: result.data.conversation.messages || [
                    {
                        role: 'assistant',
                        content: "Hey! 👋 I'm ReelMind, your personal entertainment companion. What would you like to do?",
                        timestamp: new Date().toISOString(),
                    },
                ],
                conversationId: result.data.conversation._id,
                isLoading: false,
            });
        } else {
            set({ isLoading: false });
        }
    },

    clearMessages: () => {
        set({
            messages: [
                {
                    role: 'assistant',
                    content: "Hey! 👋 I'm ReelMind. What would you like to explore today?",
                    timestamp: new Date().toISOString(),
                },
            ],
            conversationId: null,
        });
    },
}));
