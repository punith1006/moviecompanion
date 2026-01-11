'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ChevronDown, Plus, X, Star, Clock, Calendar, Brain, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layouts';
import { api, ContentItem } from '@/lib/api';

const CONTENT_TYPES = ['Movies', 'Series', 'All'];
const SORT_OPTIONS = ['Popular', 'Top Rated', 'Latest', 'Trending'];
const GENRES = ['All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'];

const MAX_LAZY_LOADS = 3; // Maximum number of auto-loads to conserve API credits

interface ExtendedContentItem extends ContentItem {
    runtime?: number | null;
    directors?: string[];
    cast?: string[];
}

export default function RecommendationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [deepMode, setDeepMode] = useState(false);
    const [contentType, setContentType] = useState('Movies');
    const [sortBy, setSortBy] = useState('Popular');
    const [genre, setGenre] = useState('All');
    const [content, setContent] = useState<ExtendedContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ExtendedContentItem | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadCount, setLoadCount] = useState(0); // Track auto-loads
    const [currentQuery, setCurrentQuery] = useState(''); // Track current search query for pagination

    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch content from TMDB API
    const fetchContent = useCallback(async (query: string | undefined = currentQuery, page = 1, append = false, typeOverride?: string) => {
        setIsLoading(page === 1 && !append);
        setIsLoadingMore(page > 1 || append);

        if (page === 1 && !append) {
            setLoadCount(0); // Reset load count on new search/filter
        }

        try {
            let response;

            if (deepMode && query?.trim() && !append) {
                response = await api.aiSearch(query.trim());
            } else {
                response = await api.discoverContent({
                    type: (typeOverride || contentType) as 'Movies' | 'Series' | 'All',
                    sortBy: sortBy as 'Popular' | 'Top' | 'Top Rated' | 'Latest' | 'Trending',
                    genre: genre,
                    page: page,
                    query: query?.trim() || undefined,
                });
            }

            if (response.success && response.data) {
                if (append) {
                    // Append to existing content, avoiding duplicates
                    setContent(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const newItems = response.data!.results.filter(item => !existingIds.has(item.id));
                        return [...prev, ...newItems];
                    });
                    setLoadCount(prev => prev + 1);
                } else {
                    setContent(response.data.results);
                    setCurrentQuery(query || '');
                }
                setTotalResults(response.data.totalResults);
                setTotalPages(response.data.totalPages);
                setCurrentPage(page);
            } else {
                console.error('Failed to fetch content:', response.error);
                if (!append) setContent([]);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
            if (!append) setContent([]);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [contentType, sortBy, genre, deepMode]);

    // Load more content (auto)
    const loadMore = useCallback(() => {
        if (isLoadingMore || loadCount >= MAX_LAZY_LOADS || currentPage >= totalPages) return;
        fetchContent(currentQuery, currentPage + 1, true);
    }, [fetchContent, currentQuery, currentPage, totalPages, isLoadingMore, loadCount]);

    // Manual load more (bypasses the auto-load limit)
    const manualLoadMore = useCallback(() => {
        if (isLoadingMore || currentPage >= totalPages) return;
        fetchContent(currentQuery, currentPage + 1, true);
    }, [fetchContent, currentQuery, currentPage, totalPages, isLoadingMore]);

    // Fetch on initial load and when filters change
    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && !isLoadingMore && loadCount < MAX_LAZY_LOADS && currentPage < totalPages) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore, isLoading, isLoadingMore, loadCount, currentPage, totalPages]);

    const handleSearch = () => {
        if (contentType !== 'All') {
            setContentType('All');
            fetchContent(searchQuery, 1, false, 'All');
        } else {
            fetchContent(searchQuery);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        fetchContent();
    };

    const handleImgError = (id: number) => {
        setImgErrors(prev => new Set(prev).add(id));
    };

    const FilterDropdown = ({ options, value, onChange, id }: { options: string[]; value: string; onChange: (val: string) => void; id: string }) => (
        <div className="relative">
            <button
                onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-sm text-white min-w-[110px] hover:border-[#484f58] transition-colors"
            >
                <span className="flex-1 text-left">{value}</span>
                <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${openDropdown === id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {openDropdown === id && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 mt-2 w-full min-w-[160px] py-1 rounded-lg bg-[#1c2128] border border-[#30363d] shadow-2xl max-h-64 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setOpenDropdown(null); }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === option ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-[#30363d]'}`}
                            >
                                {option}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <MainLayout>
            <div className="flex flex-col h-full bg-[#0d1117]">
                {/* Header Section */}
                <div className="flex-shrink-0 px-6 pt-4 pb-4 space-y-5">
                    {/* Centered Search Bar */}
                    <div className="flex justify-center">
                        <div className="relative w-full max-w-lg">
                            {/* AI Mode Glow Effect - more prominent */}
                            {deepMode && (
                                <>
                                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-full opacity-75 blur-md animate-pulse" />
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full opacity-90" />
                                </>
                            )}
                            <div className={`relative flex items-center rounded-full transition-all ${deepMode
                                ? 'bg-[#1a1d2e] border-2 border-violet-500 shadow-lg shadow-violet-500/20'
                                : 'bg-[#161b22] border border-[#30363d] hover:border-[#484f58]'
                                }`}>
                                <div className={`pl-4 ${deepMode ? 'text-violet-400' : 'text-gray-500'}`}>
                                    {deepMode ? <Sparkles className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder={deepMode ? "Describe what you're looking for..." : "Search by title..."}
                                    className={`flex-1 px-3 py-2.5 bg-transparent text-sm text-white focus:outline-none ${deepMode ? 'placeholder-violet-300/50' : 'placeholder-gray-500'}`}
                                />
                                {searchQuery && (
                                    <button onClick={clearSearch} className="p-2 text-gray-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setDeepMode(!deepMode)}
                                    className={`mx-1.5 my-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${deepMode
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/50'
                                        : 'bg-[#21262d] text-gray-400 hover:text-white hover:bg-[#30363d] border border-[#30363d]'
                                        }`}
                                >
                                    <Brain className="w-3.5 h-3.5" />
                                    <span>AI</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills - spread layout like reference */}
                    <div className="flex items-center gap-4">
                        {/* Movies - compact */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c2128] border border-[#30363d] text-sm text-white hover:border-[#484f58] transition-colors"
                            >
                                <span>{contentType}</span>
                                <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openDropdown === 'type' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute z-50 mt-2 min-w-[140px] py-1 rounded-xl bg-[#1c2128] border border-[#30363d] shadow-2xl"
                                    >
                                        {CONTENT_TYPES.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setContentType(opt); setOpenDropdown(null); }}
                                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${contentType === opt ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-[#30363d]'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Popular - wide */}
                        <div className="relative flex-1 max-w-xs">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                                className="w-full flex items-center justify-between gap-2 px-5 py-2.5 rounded-full bg-[#1c2128] border border-[#30363d] text-sm text-white hover:border-[#484f58] transition-colors"
                            >
                                <span>{sortBy}</span>
                                <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openDropdown === 'sort' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute z-50 mt-2 w-full py-1 rounded-xl bg-[#1c2128] border border-[#30363d] shadow-2xl"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setSortBy(opt); setOpenDropdown(null); }}
                                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${sortBy === opt ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-[#30363d]'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Top/Genre - medium */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}
                                className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1c2128] border border-[#30363d] text-sm text-white min-w-[100px] hover:border-[#484f58] transition-colors"
                            >
                                <span>{genre}</span>
                                <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${openDropdown === 'genre' ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openDropdown === 'genre' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="absolute z-50 mt-2 min-w-[160px] py-1 rounded-xl bg-[#1c2128] border border-[#30363d] shadow-2xl max-h-64 overflow-y-auto"
                                    >
                                        {GENRES.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setGenre(opt); setOpenDropdown(null); }}
                                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${genre === opt ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-[#30363d]'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex min-h-0">
                    {/* Poster Grid */}
                    <div className="flex-1 px-6 pb-4 overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
                            </div>
                        ) : content.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Search className="w-10 h-10 text-gray-600 mb-3" />
                                <p className="text-gray-500 text-sm">No results found</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-8">
                                {(searchQuery || deepMode) && contentType === 'All' ? (
                                    <>
                                        {content.some(i => i.type === 'movie') && (
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-4 pl-1">Movies</h3>
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                                                    {content.filter(i => i.type === 'movie').map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            whileHover={{ scale: 1.03 }}
                                                            className={`relative cursor-pointer rounded-lg overflow-hidden group flex-shrink-0 w-[160px] md:w-[200px] ${selectedItem?.id === item.id ? 'ring-2 ring-violet-500' : ''}`}
                                                            onClick={() => setSelectedItem(item)}
                                                        >
                                                            <div className="aspect-[2/3] bg-[#1a1f35]">
                                                                {!imgErrors.has(item.id) && item.posterUrl ? (
                                                                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" onError={() => handleImgError(item.id)} loading="lazy" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-violet-900/50 to-purple-900/50">
                                                                        <span className="text-2xl mb-1">{item.type === 'movie' ? '🎬' : '📺'}</span>
                                                                        <span className="text-white text-xs font-medium line-clamp-2">{item.title}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                                <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                    <span className="text-yellow-400 text-xs">{item.rating}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {content.some(i => i.type === 'series') && (
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-4 pl-1">Series</h3>
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                                                    {content.filter(i => i.type === 'series').map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            whileHover={{ scale: 1.03 }}
                                                            className={`relative cursor-pointer rounded-lg overflow-hidden group flex-shrink-0 w-[160px] md:w-[200px] ${selectedItem?.id === item.id ? 'ring-2 ring-violet-500' : ''}`}
                                                            onClick={() => setSelectedItem(item)}
                                                        >
                                                            <div className="aspect-[2/3] bg-[#1a1f35]">
                                                                {!imgErrors.has(item.id) && item.posterUrl ? (
                                                                    <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" onError={() => handleImgError(item.id)} loading="lazy" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-violet-900/50 to-purple-900/50">
                                                                        <span className="text-2xl mb-1">{item.type === 'movie' ? '🎬' : '📺'}</span>
                                                                        <span className="text-white text-xs font-medium line-clamp-2">{item.title}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                                <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                    <span className="text-yellow-400 text-xs">{item.rating}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                                        {content.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ scale: 1.03 }}
                                                className={`relative cursor-pointer rounded-lg overflow-hidden group ${selectedItem?.id === item.id ? 'ring-2 ring-violet-500' : ''}`}
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <div className="aspect-[2/3] bg-[#1a1f35]">
                                                    {!imgErrors.has(item.id) && item.posterUrl ? (
                                                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" onError={() => handleImgError(item.id)} loading="lazy" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-violet-900/50 to-purple-900/50">
                                                            <span className="text-2xl mb-1">{item.type === 'movie' ? '🎬' : '📺'}</span>
                                                            <span className="text-white text-xs font-medium line-clamp-2">{item.title}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                    <p className="text-white text-xs font-medium line-clamp-2">{item.title}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-yellow-400 text-xs">{item.rating}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Infinite Scroll Trigger & Loading Indicator */}
                        {!isLoading && content.length > 0 && (
                            <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center">
                                {isLoadingMore ? (
                                    <div className="flex items-center gap-2 text-violet-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Loading more...</span>
                                    </div>
                                ) : loadCount >= MAX_LAZY_LOADS && currentPage < totalPages ? (
                                    <button
                                        onClick={manualLoadMore}
                                        className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                                    >
                                        Load More
                                    </button>
                                ) : currentPage >= totalPages ? (
                                    <p className="text-gray-500 text-sm">You've reached the end</p>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <AnimatePresence>
                        {selectedItem && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 320 }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0 bg-[#12161f] border-l border-white/5 overflow-y-auto overflow-x-hidden"
                            >
                                <div className="w-80 p-4 relative">
                                    <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 z-10">
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1f35] mb-4">
                                        {!imgErrors.has(selectedItem.id) && selectedItem.posterUrl ? (
                                            <img src={selectedItem.posterUrl} alt={selectedItem.title} className="w-full h-full object-cover" onError={() => handleImgError(selectedItem.id)} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/50 to-purple-900/50">
                                                <span className="text-5xl">{selectedItem.type === 'movie' ? '🎬' : '📺'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="text-lg font-bold text-white mb-2">{selectedItem.title}</h2>

                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                        {selectedItem.runtime && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{selectedItem.runtime}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{selectedItem.year}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-1.5 py-0.5 rounded">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-yellow-400 font-medium">{selectedItem.rating}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{selectedItem.overview}</p>

                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Genres</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedItem.genres.map((g) => (
                                                <span key={g} className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300">{g}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedItem.directors && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 uppercase mb-2">Directors</p>
                                            <p className="text-sm text-gray-300">{selectedItem.directors.join(', ')}</p>
                                        </div>
                                    )}

                                    {selectedItem.cast && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 uppercase mb-2">Cast</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedItem.cast.map((c) => (
                                                    <span key={c} className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Add to Watch List
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout >
    );
}
