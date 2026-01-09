"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Play,
    MessageSquare,
    History,
    BookmarkPlus,
    Sparkles,
    Menu,
    X,
    LogOut,
    Filter,
    Eye,
    Pause,
    XCircle,
    ThumbsDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HistoryItem {
    _id: string;
    contentId: string;
    contentType: string;
    title: string;
    posterPath?: string;
    status: string;
    episodeProgress?: { season: number; episode: number };
    updatedAt: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    watched: { label: "Watched", icon: Eye, color: "text-green-400" },
    watching: { label: "Watching", icon: Pause, color: "text-violet-400" },
    dropped: { label: "Dropped", icon: XCircle, color: "text-orange-400" },
    not_interested: { label: "Not Interested", icon: ThumbsDown, color: "text-red-400" },
};

export default function HistoryPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/history`);
            if (filter !== "all") {
                url.searchParams.append("status", filter);
            }

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.push("/");
    };

    return (
        <div className="flex h-screen bg-[#0f0d17]">
            {/* Sidebar - Same as chat page */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1625] border-r border-[#252033] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-[#252033]">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold font-['Outfit'] text-white">CinePal</span>
                        </Link>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span>Chat</span>
                        </Link>
                        <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-400">
                            <History className="w-5 h-5" />
                            <span>History</span>
                        </Link>
                        <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <BookmarkPlus className="w-5 h-5" />
                            <span>Watchlist</span>
                        </Link>
                        <Link href="/quiz" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <Sparkles className="w-5 h-5" />
                            <span>Quiz</span>
                        </Link>
                    </nav>
                    <div className="p-4 border-t border-[#252033]">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-violet-600">
                                <AvatarFallback className="bg-violet-600 text-white">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-[#6b6873] truncate">{user?.email || ""}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-[#6b6873] hover:text-white hover:bg-[#252033]">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-64">
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#252033]">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    <span className="font-semibold text-white">History</span>
                    <div className="w-10" />
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold font-['Outfit'] text-white">Watch History</h1>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#6b6873]" />
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="bg-[#1a1625] border border-[#252033] text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="watched">Watched</option>
                                    <option value="watching">Watching</option>
                                    <option value="dropped">Dropped</option>
                                    <option value="not_interested">Not Interested</option>
                                </select>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {Array(10).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-[2/3] rounded-xl bg-[#252033]" />
                                        <Skeleton className="h-4 w-3/4 bg-[#252033]" />
                                        <Skeleton className="h-3 w-1/2 bg-[#252033]" />
                                    </div>
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20">
                                <History className="w-16 h-16 mx-auto text-[#6b6873] mb-4" />
                                <h2 className="text-xl font-semibold text-white mb-2">No history yet</h2>
                                <p className="text-[#a09dab] mb-6">Start chatting with CinePal to track what you watch!</p>
                                <Link href="/chat">
                                    <Button className="bg-violet-600 hover:bg-violet-500">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Start Chatting
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {items.map((item) => {
                                    const statusInfo = statusConfig[item.status] || statusConfig.watched;
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <div key={item._id} className="bg-[#1a1625] border border-[#252033] rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group">
                                            <div className="aspect-[2/3] bg-[#252033] relative">
                                                {item.posterPath ? (
                                                    <img src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Play className="w-8 h-8 text-[#6b6873]" />
                                                    </div>
                                                )}
                                                <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span className="text-xs">{statusInfo.label}</span>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-medium text-white truncate">{item.title}</h4>
                                                {item.episodeProgress && (
                                                    <p className="text-xs text-[#a09dab]">
                                                        S{item.episodeProgress.season} E{item.episodeProgress.episode}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
}
