'use client';

import { useState } from 'react';
import { Plus, Bookmark, Check, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, ContentItem } from '@/lib/api';

interface ChatContentCardProps {
    item: ContentItem;
    onAddToLibrary?: () => void;
    onAddToWatchlist?: () => void;
}

export function ChatContentCard({ item, onAddToLibrary, onAddToWatchlist }: ChatContentCardProps) {
    const [addingToLibrary, setAddingToLibrary] = useState(false);
    const [addingToWatchlist, setAddingToWatchlist] = useState(false);
    const [inLibrary, setInLibrary] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [imgError, setImgError] = useState(false);

    const handleAddToLibrary = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inLibrary || addingToLibrary) return;
        setAddingToLibrary(true);
        try {
            await api.addOrUpdateWatch({
                tmdbId: item.id,
                title: item.title,
                type: item.type,
                status: 'want_to_watch',
                posterUrl: item.posterUrl || undefined,
                genres: Array.isArray(item.genres) ? item.genres.map(g => String(g)) : [],
                platform: 'Unknown',
            });
            setInLibrary(true);
            onAddToLibrary?.();
        } catch (e) {
            console.error('Failed to add to library:', e);
        } finally {
            setAddingToLibrary(false);
        }
    };

    const handleAddToWatchlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inWatchlist || addingToWatchlist) return;
        setAddingToWatchlist(true);
        try {
            await api.addOrUpdateWatch({
                tmdbId: item.id,
                title: item.title,
                type: item.type,
                status: 'watching',
                posterUrl: item.posterUrl || undefined,
                genres: Array.isArray(item.genres) ? item.genres.map(g => String(g)) : [],
                platform: 'Unknown',
            });
            setInWatchlist(true);
            onAddToWatchlist?.();
        } catch (e) {
            console.error('Failed to add to watchlist:', e);
        } finally {
            setAddingToWatchlist(false);
        }
    };

    return (
        <motion.div
            className="flex flex-col cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            {/* Poster Image */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1f35] shadow-lg">
                {!imgError && item.posterUrl ? (
                    <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-violet-900/50 to-purple-900/50">
                        <span className="text-4xl mb-2">{item.type === 'movie' ? '🎬' : '📺'}</span>
                        <span className="text-white text-sm font-medium line-clamp-2">{item.title}</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h4 className="text-white font-medium text-sm mt-2 line-clamp-1">{item.title}</h4>

            {/* Rating & Year */}
            <div className="flex items-center gap-1.5 text-xs mt-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-medium">{item.rating?.toFixed(1) || 'N/A'}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{item.year || 'N/A'}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleAddToLibrary}
                    disabled={inLibrary || addingToLibrary}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${inLibrary
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        }`}
                >
                    {addingToLibrary ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : inLibrary ? (
                        <Check className="w-3.5 h-3.5" />
                    ) : (
                        <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{inLibrary ? 'Added' : 'Library'}</span>
                </button>

                <button
                    onClick={handleAddToWatchlist}
                    disabled={inWatchlist || addingToWatchlist}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${inWatchlist
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[#1c2128] hover:bg-[#2a2f3d] text-white border border-white/10'
                        }`}
                >
                    {addingToWatchlist ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : inWatchlist ? (
                        <Check className="w-3.5 h-3.5" />
                    ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                    )}
                    <span>{inWatchlist ? 'Added' : 'Watch'}</span>
                </button>
            </div>
        </motion.div>
    );
}
