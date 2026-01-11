'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Star, Trophy, Zap, Tv, Film, Quote } from 'lucide-react';
import { MainLayout } from '@/components/layouts';
import { api, WatchStats, SavedQuote } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

export default function StatsPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<WatchStats | null>(null);
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [statsResult, quotesResult] = await Promise.all([
            api.getWatchStats(),
            api.getAllQuotes(),
        ]);

        if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
        }
        if (quotesResult.success && quotesResult.data) {
            setQuotes(quotesResult.data.quotes);
        }
        setIsLoading(false);
    };

    const xpToNextLevel = (level: number) => level * 500;
    const currentXP = user?.stats.totalXP || 0;
    const currentLevel = user?.stats.level || 1;
    const progress = (currentXP % 500) / 5; // Percentage to next level

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                        Your Stats
                    </h1>
                    <p className="text-gray-400">Track your entertainment journey</p>
                </div>

                {/* Level Progress Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 mb-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Current Level</p>
                                <p className="text-3xl font-display font-bold text-white">Level {currentLevel}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Total XP</p>
                            <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                                <Zap className="w-5 h-5" />
                                {currentXP}
                            </p>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Progress to Level {currentLevel + 1}</span>
                            <span className="text-violet-400">{currentXP % 500} / 500 XP</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={<Tv className="w-6 h-6" />}
                        label="Watching"
                        value={stats?.overview.watching || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={<Star className="w-6 h-6" />}
                        label="Completed"
                        value={stats?.overview.completed || 0}
                        color="green"
                    />
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        label="Want to Watch"
                        value={stats?.overview.wantToWatch || 0}
                        color="pink"
                    />
                    <StatCard
                        icon={<Film className="w-6 h-6" />}
                        label="Total Tracked"
                        value={stats?.overview.total || 0}
                        color="violet"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Top Genres */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass p-6"
                    >
                        <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-400" />
                            Top Genres
                        </h3>

                        {stats?.topGenres && stats.topGenres.length > 0 ? (
                            <div className="space-y-3">
                                {stats.topGenres.slice(0, 5).map((genre, i) => {
                                    const maxCount = stats.topGenres[0].count;
                                    const percentage = (genre.count / maxCount) * 100;

                                    return (
                                        <div key={genre.genre}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-white">{genre.genre}</span>
                                                <span className="text-gray-400">{genre.count}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No genre data yet</p>
                        )}
                    </motion.div>

                    {/* Platforms */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass p-6"
                    >
                        <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-violet-400" />
                            Platforms
                        </h3>

                        {stats?.platforms && stats.platforms.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {stats.platforms.map((platform) => (
                                    <div
                                        key={platform.platform}
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <p className="font-medium text-white">{platform.platform}</p>
                                        <p className="text-sm text-gray-400">{platform.count} shows</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No platform data yet</p>
                        )}
                    </motion.div>
                </div>

                {/* Saved Quotes */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6"
                >
                    <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                        <Quote className="w-5 h-5 text-yellow-400" />
                        Saved Quotes ({quotes.length})
                    </h3>

                    {quotes.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {quotes.slice(0, 4).map((q, i) => (
                                <div key={i} className="p-4 rounded-xl bg-white/5">
                                    <p className="text-white italic mb-2">&ldquo;{q.quote}&rdquo;</p>
                                    <p className="text-sm text-violet-400">— {q.character}</p>
                                    <p className="text-xs text-gray-500 mt-1">{q.showTitle}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">
                            No saved quotes yet. Ask ReelMind to save memorable quotes from your shows!
                        </p>
                    )}
                </motion.div>
            </div>
        </MainLayout>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'blue' | 'green' | 'pink' | 'violet';
}) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
        green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
        pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
        violet: 'from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass p-4 bg-gradient-to-br ${colors[color]}`}
        >
            <div className={`mb-2 ${colors[color].split(' ').pop()}`}>{icon}</div>
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
        </motion.div>
    );
}
