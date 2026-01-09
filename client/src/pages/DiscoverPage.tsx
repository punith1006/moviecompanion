import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Compass, TrendingUp, Star, Filter, Play, Plus, X, Search } from 'lucide-react'
import axios from 'axios'

interface Show {
    id: string
    title: string
    year?: number
    rating?: number
    overview?: string
    poster_url?: string
    type: 'movie' | 'series'
}

const genres = [
    { id: 'all', label: 'All', emoji: '🌟' },
    { id: 'comedy', label: 'Comedy', emoji: '😂' },
    { id: 'drama', label: 'Drama', emoji: '🎭' },
    { id: 'thriller', label: 'Thriller', emoji: '😰' },
    { id: 'sci-fi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'action', label: 'Action', emoji: '💥' },
    { id: 'romance', label: 'Romance', emoji: '💕' },
    { id: 'horror', label: 'Horror', emoji: '👻' },
]

export default function DiscoverPage() {
    const [shows, setShows] = useState<Show[]>([])
    const [loading, setLoading] = useState(true)
    const [activeGenre, setActiveGenre] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadRecommendations()
    }, [activeGenre])

    const loadRecommendations = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ count: '12' })
            if (activeGenre !== 'all') params.append('genre', activeGenre)

            const response = await axios.get(`/api/recommendations/default_user?${params}`)
            setShows(response.data.recommendations || [])
        } catch (error) {
            console.error('Failed to load recommendations:', error)
            // Mock data for demo
            setShows([
                { id: '1', title: 'Breaking Bad', year: 2008, rating: 9.5, type: 'series', overview: 'A high school chemistry teacher diagnosed with lung cancer turns to manufacturing and selling meth.' },
                { id: '2', title: 'Stranger Things', year: 2016, rating: 8.7, type: 'series', overview: 'When a young boy disappears, his mother and friends must confront terrifying supernatural forces.' },
                { id: '3', title: 'The Dark Knight', year: 2008, rating: 9.0, type: 'movie', overview: 'Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const addToWatchlist = async (show: Show) => {
        try {
            await axios.post('/api/chat', {
                message: `Add ${show.title} to my watchlist`,
                user_id: 'default_user',
            })
        } catch (error) {
            console.error('Failed to add to watchlist:', error)
        }
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Discover</h1>
                        <p className="text-white/50">Find your next favorite</p>
                    </div>
                </div>
            </motion.header>

            {/* Search & Filters */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8 space-y-4"
            >
                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search movies & shows..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl glass"
                    />
                </div>

                {/* Genre pills */}
                <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => setActiveGenre(genre.id)}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${activeGenre === genre.id
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'glass text-white/70 hover:text-white hover:border-purple-500/30'
                                }`}
                        >
                            <span className="mr-2">{genre.emoji}</span>
                            {genre.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Shows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                            <div className="aspect-[2/3] bg-white/5" />
                            <div className="p-4 space-y-2">
                                <div className="h-5 bg-white/5 rounded w-3/4" />
                                <div className="h-4 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                    : shows.map((show, index) => (
                        <motion.div
                            key={show.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group glass rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                        >
                            {/* Poster */}
                            <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                {show.poster_url ? (
                                    <img
                                        src={show.poster_url}
                                        alt={show.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl">
                                        {show.type === 'movie' ? '🎬' : '📺'}
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                        <button
                                            onClick={() => addToWatchlist(show)}
                                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add to List
                                        </button>
                                    </div>
                                </div>

                                {/* Rating badge */}
                                {show.rating && (
                                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm font-medium text-white">{show.rating.toFixed(1)}</span>
                                    </div>
                                )}

                                {/* Type badge */}
                                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                    <span className="text-xs font-medium text-white/80">
                                        {show.type === 'movie' ? '🎬 Movie' : '📺 Series'}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-white truncate">{show.title}</h3>
                                <p className="text-sm text-white/50">{show.year}</p>
                                {show.overview && (
                                    <p className="text-sm text-white/40 mt-2 line-clamp-2">{show.overview}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Empty state */}
            {!loading && shows.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No shows found</h3>
                    <p className="text-white/50">Try a different genre or check back later</p>
                </motion.div>
            )}
        </div>
    )
}
