'use client';

import { motion } from 'framer-motion';
import { Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MessageBubbleProps {
    message: Message;
    isLast?: boolean;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    // Format timestamp - use consistent format to avoid hydration mismatch
    const formatTime = (timestamp: string | Date) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
                'flex gap-3 mb-4 max-w-[85%]',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
        >
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                    className={cn(
                        'text-xs',
                        isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                    )}
                >
                    {isUser ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>

            {/* Message Content */}
            <div
                className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'glass rounded-bl-md'
                )}
            >
                {/* Render markdown-like content */}
                <div className="prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => {
                        // Bold text
                        const formattedLine = line.replace(
                            /\*\*(.+?)\*\*/g,
                            '<strong class="text-foreground font-semibold">$1</strong>'
                        );

                        // Check for bullet points
                        if (line.startsWith('•') || line.startsWith('-')) {
                            return (
                                <p
                                    key={i}
                                    className="my-0.5 pl-2"
                                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                                />
                            );
                        }

                        // Check for headers (lines starting with emoji or markdown headers)
                        if (/^[📺🎬✨🎯📚📝🛡️📊##]/.test(line)) {
                            return (
                                <p
                                    key={i}
                                    className="my-2 font-semibold text-foreground"
                                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                                />
                            );
                        }

                        // Regular paragraph
                        if (line.trim()) {
                            return (
                                <p
                                    key={i}
                                    className="my-1"
                                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                                />
                            );
                        }

                        // Empty line = spacing
                        return <div key={i} className="h-2" />;
                    })}
                </div>

                {/* Timestamp */}
                <div
                    className={cn(
                        'text-[10px] mt-2 opacity-60',
                        isUser ? 'text-right' : 'text-left'
                    )}
                >
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </motion.div>
    );
}

// Typing indicator component
export function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mr-auto max-w-[85%] mb-4"
        >
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    <Brain className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>

            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </div>
            </div>
        </motion.div>
    );
}
