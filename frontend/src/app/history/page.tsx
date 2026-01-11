'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Clock, CheckCircle, Eye, Heart, Star, Trash2, MoreVertical } from 'lucide-react';
import { MainLayout } from '@/components/layouts';
import { api, WatchEntry } from '@/lib/api';

const STATUS_TABS = [
    { id: 'all', label: 'All', icon: null },
    { id: 'watching', label: 'Watching', icon: Eye },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'want_to_watch', label: 'Want to Watch', icon: Heart },
];

export default function HistoryPage() {
    const [entries, setEntries] = useState<WatchEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadHistory();
    }, [activeTab]);

    const loadHistory = async () => {
        setIsLoading(true);
        const params = activeTab !== 'all' ? { status: activeTab } : undefined;
        const result = await api.getWatchHistory(params);

        if (result.success && result.data) {
            setEntries(result.data.items);
        }
        setIsLoading(false);
    };

    const filteredEntries = entries.filter((entry) =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'watching': return 'text-blue-400 bg-blue-500/20';
            case 'completed': return 'text-green-400 bg-green-500/20';
            case 'want_to_watch': return 'text-pink-400 bg-pink-500/20';
            case 'dropped': return 'text-gray-400 bg-gray-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const handleDelete = async (id: string) => {
        const result = await api.deleteWatchEntry(id);
        if (result.success) {
            setEntries(entries.filter((e) => e._id !== id));
        }
    };

    return (
        <MainLayout>
            <div className="flex flex-col h-full p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                            Watch History
                        </h1>
                        <p className="text-gray-400">Track all your shows and movies</p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Show
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your shows..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No shows yet</h3>
                            <p className="text-gray-400 max-w-sm">
                                Start tracking your favorite shows and movies by clicking &quot;Add Show&quot; above.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredEntries.map((entry) => (
                                    <motion.div
                                        key={entry._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="glass-hover group"
                                    >
                                        <div className="flex gap-4 p-4">
                                            {/* Poster */}
                                            <div className="w-20 h-28 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                                                {entry.posterUrl ? (
                                                    <img
                                                        src={entry.posterUrl}
                                                        alt={entry.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        📺
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate">{entry.title}</h3>
                                                <p className="text-sm text-gray-400 capitalize">{entry.type}</p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(entry.status)}`}>
                                                        {entry.status.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {entry.progress && entry.type === 'series' && (
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        S{entry.progress.season} E{entry.progress.episode}
                                                    </p>
                                                )}

                                                {entry.rating && (
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-4 h-4 ${i < entry.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Add Modal - Simple for now */}
                <AnimatePresence>
                    {showAddModal && (
                        <AddShowModal onClose={() => setShowAddModal(false)} onAdded={loadHistory} />
                    )}
                </AnimatePresence>
            </div>
        </MainLayout>
    );
}

function AddShowModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState('Netflix');
    const [type, setType] = useState<'movie' | 'series'>('series');
    const [status, setStatus] = useState<'watching' | 'completed' | 'want_to_watch'>('watching');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await api.addOrUpdateWatch({
            tmdbId: Math.floor(Math.random() * 100000), // Temporary - should search TMDB
            title,
            type,
            platform,
            status,
            genres: [],
        });

        if (result.success) {
            onAdded();
            onClose();
        }
        setIsLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="glass w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-display font-bold text-white mb-4">Add Show</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Show or movie name"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as 'movie' | 'series')}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                            >
                                <option value="series">Series</option>
                                <option value="movie">Movie</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                            >
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="want_to_watch">Want to Watch</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Platform</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500"
                        >
                            <option>Netflix</option>
                            <option>Prime Video</option>
                            <option>Disney+</option>
                            <option>HBO Max</option>
                            <option>Apple TV+</option>
                            <option>Hulu</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
