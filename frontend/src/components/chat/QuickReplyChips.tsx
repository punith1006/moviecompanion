'use client';

import { motion } from 'framer-motion';
import {
    Plus, Shuffle, Info, Film, Play, LayoutGrid,
    Sparkles, TrendingUp, MessageSquare, Star
} from 'lucide-react';

interface SuggestedReply {
    label: string;
    icon: string;
}

interface QuickReplyChipsProps {
    replies: SuggestedReply[];
    onChipClick: (message: string) => void;
    disabled?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
    plus: <Plus className="w-3.5 h-3.5" />,
    shuffle: <Shuffle className="w-3.5 h-3.5" />,
    info: <Info className="w-3.5 h-3.5" />,
    film: <Film className="w-3.5 h-3.5" />,
    play: <Play className="w-3.5 h-3.5" />,
    grid: <LayoutGrid className="w-3.5 h-3.5" />,
    sparkles: <Sparkles className="w-3.5 h-3.5" />,
    trending: <TrendingUp className="w-3.5 h-3.5" />,
    message: <MessageSquare className="w-3.5 h-3.5" />,
    star: <Star className="w-3.5 h-3.5" />,
};

export function QuickReplyChips({ replies, onChipClick, disabled }: QuickReplyChipsProps) {
    if (!replies || replies.length === 0) return null;

    return (
        <motion.div
            className="flex flex-wrap gap-2 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
        >
            {replies.map((reply, index) => (
                <motion.button
                    key={reply.label}
                    onClick={() => !disabled && onChipClick(reply.label)}
                    disabled={disabled}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200
                        ${disabled
                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-violet-600 text-gray-300 hover:text-white border border-white/10 hover:border-violet-500'
                        }
                    `}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                >
                    {iconMap[reply.icon] || <MessageSquare className="w-3.5 h-3.5" />}
                    <span>{reply.label}</span>
                </motion.button>
            ))}
        </motion.div>
    );
}
