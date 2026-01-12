'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Home,
    MessageSquare,
    Film,
    Sparkles,
    HelpCircle,
    BarChart3,
    Brain,
    LogOut,
    Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSidebar } from './MainLayout';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/recommendations', label: 'Discover', icon: Sparkles },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/quiz', label: 'Quiz', icon: HelpCircle },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { isCollapsed, toggleSidebar } = useSidebar();

    const handleLogout = () => {
        logout();
        router.push('/auth');
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 64 : 240 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border"
        >
            {/* Logo Header */}
            <div className={cn("p-3 border-b border-sidebar-border", isCollapsed && "px-2")}>
                <div className="flex items-center gap-2">
                    {/* Menu/Collapse Toggle - Always visible */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-violet-600/20 transition-colors flex-shrink-0"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo - only when expanded */}
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center gap-2 group">
                            <motion.div
                                whileHover={{ rotate: 10 }}
                                className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0"
                            >
                                <Brain className="h-4 w-4 text-white" />
                            </motion.div>
                            <h1 className="font-display font-bold text-base text-foreground whitespace-nowrap">
                                ReelMind
                            </h1>
                        </Link>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className={cn("flex-1 p-2 space-y-1", isCollapsed && "px-1.5")}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            onClick={(e) => {
                                if (item.label === 'Discover' && pathname === '/recommendations') {
                                    // Trigger reset if already on page
                                    window.dispatchEvent(new Event('reset-discovery'));
                                }
                            }}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                                'text-sm font-medium transition-all duration-200',
                                isCollapsed && 'justify-center px-2',
                                isActive
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            )}
                        >
                            <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
                            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className={cn("p-2 border-t border-sidebar-border", isCollapsed && "px-1.5")}>
                {isAuthenticated && user ? (
                    <>
                        {/* XP Progress - only when expanded */}
                        {!isCollapsed && (
                            <div className="mb-3 p-2.5 rounded-xl bg-sidebar-accent/50">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">Level {user.stats.level}</span>
                                    <span className="text-gold font-medium">{user.stats.totalXP} XP</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(user.stats.totalXP % 500) / 5}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-violet-500 to-gold rounded-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* User Profile */}
                        <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center')}>
                            <Avatar className={cn('border-2 border-primary', isCollapsed ? 'h-9 w-9' : 'h-8 w-8')} title={user.name}>
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.stats.showsWatched} shows
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <Link
                        href="/auth"
                        className={cn(
                            'flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 transition-all',
                            isCollapsed ? 'px-2' : 'w-full'
                        )}
                        title="Sign In"
                    >
                        {isCollapsed ? <Brain className="h-5 w-5" /> : 'Sign In'}
                    </Link>
                )}
            </div>
        </motion.aside>
    );
}
