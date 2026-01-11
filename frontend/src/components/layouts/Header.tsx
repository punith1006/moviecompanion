'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

export function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();

    // Don't show on auth page
    if (pathname === '/auth') return null;

    return (
        <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-display font-bold text-lg">ReelMind</span>
                </Link>

                {/* User XP */}
                {isAuthenticated && user ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30">
                        <Zap className="h-4 w-4 text-gold" />
                        <span className="text-sm font-medium text-gold">{user.stats.totalXP} XP</span>
                    </div>
                ) : (
                    <Link
                        href="/auth"
                        className="px-4 py-1.5 rounded-full bg-violet-500 text-white text-sm font-medium"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
}
