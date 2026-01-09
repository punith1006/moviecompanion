import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Film, Clock, CheckCircle, List, Star, Play, Trash2 } from 'lucide-react'
import axios from 'axios'

interface Show {
    title: string
    type: 'movie' | 'series'
    status: 'ongoing' | 'completed' | 'dropped' | 'watchlist'
    rating?: number
    poster_url?: string
    year?: number
    last_watched?: {
        season: number
        episode: number
    }
}

const filters = [
    { id: 'all', label: 'All', icon: List },
    { id: 'ongoing', label: 'Watching', icon: Play },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'watchlist', label: 'Watchlist', icon: Clock },
]

const statusColors = {
    ongoing: 'from-green-500 to-emerald-500',
    completed: 'from-purple-500 to-pink-500',
    dropped: 'from-red-500 to-orange-500',
    watchlist: 'from-yellow-500 to-amber-500',
}

export default function MyShowsPage() {
    const [shows, setShows] = useState<Show[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')

    useEffect(() => {
        loadHistory()
    }, [activeFilter])

    const loadHistory = async () => {
        setLoading(true)
        try {
            const params = activeFilter !== 'all' ? `?status=${activeFilter}` : ''
            const response = await axios.get(`/api/history/default_user${params}`)
            setShows(response.data.history || [])
        } catch (error) {
            console.error('Failed to load history:', error)
            setShows([])
        } finally {
            setLoading(false)
        }
    }

    const filteredShows = shows.filter(
        (show) => activeFilter === 'all' || show.status === activeFilter
    )

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">My Shows</h1>
                        <p className="text-white/50">Track your entertainment journey</p>
                    </div>
                </div>
            </motion.header>

            {/* Stats */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {[
                    { label: 'Total', value: shows.length, color: 'from-purple-500 to-pink-500' },
                    { label: 'Watching', value: shows.filter(s => s.status === 'ongoing').length, color: 'from-green-500 to-emerald-500' },
                    { label: 'Completed', value: shows.filter(s => s.status === 'completed').length, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Watchlist', value: shows.filter(s => s.status === 'watchlist').length, color: 'from-yellow-500 to-amber-500' },
                ].map((stat) => (
                    <div key={stat.label} className="glass rounded-2xl p-4">
                        <p className="text-white/50 text-sm">{stat.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 mb-8 overflow-x-auto pb-2"
            >
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${activeFilter === filter.id
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                : 'glass text-white/70 hover:text-white'
                            }`}
                    >
                        <filter.icon className="w-4 h-4" />
                        {filter.label}
                    </button>
                ))}
            </motion.div>

            {/* Shows Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                            <div className="aspect-[2/3] bg-white/5" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-white/5 rounded w-3/4" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredShows.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                >
                    {filteredShows.map((show, index) => (
                        <motion.div
                            key={show.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="group glass rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                        >
                            {/* Poster */}
                            <div className="aspect-[2/3] relative bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                {show.poster_url ? (
                                    <img
                                        src={show.poster_url}
                                        alt={show.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl">
                                        {show.type === 'movie' ? '🎬' : '📺'}
                                    </div>
                                )}

                                {/* Status badge */}
                                <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg bg-gradient-to-r ${statusColors[show.status]} text-white text-xs font-medium`}>
                                    {show.status}
                                </div>

                                {/* Progress for series */}
                                {show.last_watched && show.type === 'series' && (
                                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
                                        <p className="text-xs text-white/80 text-center">
                                            S{show.last_watched.season} E{show.last_watched.episode}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                                <h3 className="font-medium text-white text-sm truncate">{show.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {show.rating && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs text-white/60">{show.rating}</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-white/40">{show.type}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No shows yet</h3>
                    <p className="text-white/50 mb-6">Start tracking by chatting with your companion!</p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        Start Chatting
                    </a>
                </motion.div>
            )}
        </div>
    )
}
