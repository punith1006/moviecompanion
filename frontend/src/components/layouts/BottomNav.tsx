'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Film, Sparkles, HelpCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Chat', icon: MessageSquare },
    { href: '/history', label: 'History', icon: Film },
    { href: '/recommendations', label: 'Discover', icon: Sparkles },
    { href: '/quiz', label: 'Quiz', icon: HelpCircle },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function BottomNav() {
    const pathname = usePathname();

    // Don't show on auth page
    if (pathname === '/auth') return null;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
            <div className="flex items-center justify-around py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl relative',
                                'transition-all duration-200',
                                isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomnav-active"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon className={cn('h-5 w-5 relative z-10', isActive && 'text-primary')} />
                            <span className="text-[10px] font-medium relative z-10">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
