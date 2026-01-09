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
    Star,
    Check,
    Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WatchlistItem {
    _id: string;
    contentId: string;
    contentType: string;
    title: string;
    posterPath?: string;
    priority: string;
}

const priorityColors: Record<string, string> = {
    must_watch: "bg-violet-600 text-white",
    interested: "bg-blue-600 text-white",
    maybe: "bg-gray-600 text-white",
};

const priorityLabels: Record<string, string> = {
    must_watch: "Must Watch",
    interested: "Interested",
    maybe: "Maybe",
};

export default function WatchlistPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchWatchlist();
    }, []);

    const fetchWatchlist = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error("Failed to fetch watchlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setItems(items.filter((item) => item._id !== id));
                toast.success("Removed from watchlist");
            }
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    const handleMarkWatched = async (item: WatchlistItem) => {
        try {
            const token = localStorage.getItem("accessToken");
            // Add to history
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentId: item.contentId,
                    contentType: item.contentType,
                    title: item.title,
                    posterPath: item.posterPath,
                    status: "watched",
                }),
            });

            // Remove from watchlist
            await handleRemove(item._id);
            toast.success(`Marked "${item.title}" as watched!`);
        } catch (error) {
            toast.error("Failed to update");
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
            {/* Sidebar */}
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
                        <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors">
                            <History className="w-5 h-5" />
                            <span>History</span>
                        </Link>
                        <Link href="/watchlist" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-400">
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
                    <span className="font-semibold text-white">Watchlist</span>
                    <div className="w-10" />
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold font-['Outfit'] text-white mb-6">My Watchlist</h1>

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {Array(10).fill(0).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-[2/3] rounded-xl bg-[#252033]" />
                                        <Skeleton className="h-4 w-3/4 bg-[#252033]" />
                                    </div>
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20">
                                <BookmarkPlus className="w-16 h-16 mx-auto text-[#6b6873] mb-4" />
                                <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
                                <p className="text-[#a09dab] mb-6">Chat with CinePal to discover shows and add them here!</p>
                                <Link href="/chat">
                                    <Button className="bg-violet-600 hover:bg-violet-500">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Find Something to Watch
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {items.map((item) => (
                                    <div key={item._id} className="bg-[#1a1625] border border-[#252033] rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group">
                                        <div className="aspect-[2/3] bg-[#252033] relative">
                                            {item.posterPath ? (
                                                <img src={`https://image.tmdb.org/t/p/w500${item.posterPath}`} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-[#6b6873]" />
                                                </div>
                                            )}
                                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs ${priorityColors[item.priority] || priorityColors.interested}`}>
                                                {priorityLabels[item.priority] || "Interested"}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-medium text-white truncate mb-2">{item.title}</h4>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-1 h-8 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                    onClick={() => handleMarkWatched(item)}
                                                >
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Watched
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => handleRemove(item._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        </div>
    );
}
