'use client';

import { motion } from 'framer-motion';
import { Film, Sparkles, Brain, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
    {
        id: 'add-show',
        label: 'Add Show',
        icon: Film,
        color: 'text-emerald-400',
    },
    {
        id: 'recap',
        label: 'Get Recap',
        icon: Brain,
        color: 'text-violet-400',
    },
    {
        id: 'recommend',
        label: 'Recommend',
        icon: Sparkles,
        color: 'text-amber-400',
    },
    {
        id: 'quiz',
        label: 'Quiz Me',
        icon: HelpCircle,
        color: 'text-sky-400',
    },
];

interface QuickActionsProps {
    onAction: (actionId: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
    return (
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {quickActions.map((action, index) => (
                <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAction(action.id)}
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        'bg-secondary/50 hover:bg-secondary/80',
                        'text-sm text-foreground whitespace-nowrap',
                        'transition-colors duration-200',
                        'border border-border/50 hover:border-border'
                    )}
                >
                    <action.icon className={cn('h-4 w-4', action.color)} />
                    <span>{action.label}</span>
                </motion.button>
            ))}
        </div>
    );
}
