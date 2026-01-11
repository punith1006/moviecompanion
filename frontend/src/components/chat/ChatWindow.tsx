'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { useChatStore } from '@/lib/stores/chatStore';
import { useAuthStore } from '@/lib/stores/authStore';

// Typing indicator component
function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 mb-4"
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">
                🎬
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-violet-400 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export function ChatWindow() {
    const { messages, isLoading, sendMessage } = useChatStore();
    const { user, isAuthenticated, checkAuth } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (content: string) => {
        await sendMessage(content);
    };

    const handleQuickAction = (action: string) => {
        const actionMessages: Record<string, string> = {
            'add-show': 'I want to add a show to my watch history',
            'recap': 'Give me a recap of what I was watching',
            'recommend': 'Recommend me something new to watch',
            'quiz': 'Start a quiz about my completed shows',
        };
        handleSend(actionMessages[action] || action);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
                <div className="max-w-3xl mx-auto">
                    {/* Welcome message for new users */}
                    {!isAuthenticated && messages.length === 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center"
                        >
                            <p className="text-violet-300">
                                💡 Sign in to save your watch history and get personalized recommendations!
                            </p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={`${message.timestamp}-${index}`}
                                message={message}
                                isLast={index === messages.length - 1 && !isLoading}
                            />
                        ))}
                        {isLoading && <TypingIndicator />}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/5 bg-background/80 backdrop-blur-lg">
                <div className="max-w-3xl mx-auto p-4 space-y-4">
                    {/* Quick Actions */}
                    {messages.length <= 2 && (
                        <QuickActions onAction={handleQuickAction} />
                    )}

                    {/* Input */}
                    <ChatInput onSend={handleSend} disabled={isLoading} />
                </div>
            </div>
        </div>
    );
}
