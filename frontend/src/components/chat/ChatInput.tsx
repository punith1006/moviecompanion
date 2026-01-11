'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput || disabled) return;

        setInput('');
        onSend(trimmedInput);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-2">
                <div className="flex-1 relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about your shows..."
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            'w-full resize-none rounded-xl border-0 bg-secondary/50 px-4 py-3 pr-12',
                            'text-sm text-foreground placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-primary/50',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'min-h-[48px] max-h-[120px]'
                        )}
                        style={{
                            height: 'auto',
                            overflow: 'hidden'
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                        }}
                    />
                </div>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || disabled}
                        className={cn(
                            'h-12 w-12 rounded-xl',
                            'bg-primary hover:bg-primary/90',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-all duration-200',
                            input.trim() && !disabled && 'glow-violet'
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </motion.div>
            </div>

            {/* Character hint */}
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
            </p>
        </form>
    );
}
