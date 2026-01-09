"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Play,
    Send,
    MessageSquare,
    History,
    BookmarkPlus,
    Sparkles,
    Menu,
    X,
    LogOut,
    Plus,
    ThumbsDown,
    Check,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    recommendations?: ContentItem[];
}

interface ContentItem {
    id: number;
    title: string;
    posterPath: string | null;
    overview?: string;
    releaseDate?: string;
    voteAverage?: number;
    contentType: string;
    reason?: string;
}

export default function ChatPage() {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hey there! 👋 I'm CinePal, your AI entertainment companion. What are you in the mood to watch today? I can recommend movies, TV shows, or help you find something specific!",
            recommendations: [],
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Check auth
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "I'd be happy to help you find something to watch!",
                recommendations: data.recommendations || [],
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            toast.error("Failed to get response. Please try again.");
            console.error("Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        router.push("/");
    };

    const handleAddToWatchlist = async (item: ContentItem) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentId: String(item.id),
                    contentType: item.contentType === "tv" ? "tv" : "movie",
                    title: item.title,
                    posterPath: item.posterPath || "",
                    priority: "interested"
                }),
            });
            if (response.ok) {
                toast.success(`Added "${item.title}" to your watchlist!`);
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to add to watchlist");
            }
        } catch (error) {
            toast.error("Failed to add to watchlist");
        }
    };

    const handleMarkWatched = async (item: ContentItem) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentId: String(item.id),
                    contentType: item.contentType === "tv" ? "tv" : "movie",
                    title: item.title,
                    posterPath: item.posterPath || "",
                    status: "watched"
                }),
            });
            if (response.ok) {
                toast.success(`Marked "${item.title}" as watched!`);
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to mark as watched");
            }
        } catch (error) {
            toast.error("Failed to mark as watched");
        }
    };

    const handleNotInterested = async (item: ContentItem) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentId: String(item.id),
                    contentType: item.contentType === "tv" ? "tv" : "movie",
                    title: item.title,
                    posterPath: item.posterPath || "",
                    status: "not_interested"
                }),
            });
            if (response.ok) {
                toast.info(`Got it! I won't recommend "${item.title}" again.`);
            } else {
                toast.error("Failed to save preference");
            }
        } catch (error) {
            toast.error("Failed to save preference");
        }
    };

    return (
        <div className="flex h-screen bg-[#0f0d17]">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1625] border-r border-[#252033] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-4 border-b border-[#252033]">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold font-['Outfit'] text-white">CinePal</span>
                        </Link>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-2">
                        <Link
                            href="/chat"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-400"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span>Chat</span>
                        </Link>
                        <Link
                            href="/history"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors"
                        >
                            <History className="w-5 h-5" />
                            <span>History</span>
                        </Link>
                        <Link
                            href="/watchlist"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors"
                        >
                            <BookmarkPlus className="w-5 h-5" />
                            <span>Watchlist</span>
                        </Link>
                        <Link
                            href="/quiz"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a09dab] hover:bg-[#252033] hover:text-white transition-colors"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>Quiz</span>
                        </Link>
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-[#252033]">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-violet-600">
                                <AvatarFallback className="bg-violet-600 text-white">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-[#6b6873] truncate">{user?.email || ""}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-[#6b6873] hover:text-white hover:bg-[#252033]"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#252033]">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-white"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                        <span className="font-semibold text-white">CinePal</span>
                    </div>
                    <div className="w-10" />
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] md:max-w-[70%] ${message.role === "user"
                                    ? "bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-3"
                                    : "space-y-4"
                                    }`}
                            >
                                {message.role === "assistant" ? (
                                    <>
                                        <div className="bg-[#1a1625] border border-[#252033] rounded-2xl rounded-bl-md px-4 py-3 text-[#e2e1e7]">
                                            {message.content}
                                        </div>
                                        {message.recommendations && message.recommendations.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {message.recommendations.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-[#1a1625] border border-[#252033] rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors group"
                                                    >
                                                        <div className="aspect-[2/3] bg-[#252033] relative">
                                                            {item.posterPath ? (
                                                                <img
                                                                    src={item.posterPath.startsWith("http") ? item.posterPath : `https://image.tmdb.org/t/p/w500${item.posterPath}`}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Play className="w-8 h-8 text-[#6b6873]" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                                                {item.contentType === "tv" ? "TV" : "Movie"}
                                                            </div>
                                                        </div>
                                                        <div className="p-3">
                                                            <h4 className="font-medium text-white truncate">{item.title}</h4>
                                                            {item.reason && (
                                                                <p className="text-xs text-[#a09dab] mt-1 line-clamp-2">{item.reason}</p>
                                                            )}
                                                            <div className="flex items-center gap-1 mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="flex-1 h-8 text-xs text-[#a09dab] hover:text-white hover:bg-[#252033]"
                                                                    onClick={() => handleAddToWatchlist(item)}
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" />
                                                                    Watchlist
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-[#a09dab] hover:text-green-400 hover:bg-[#252033]"
                                                                    onClick={() => handleMarkWatched(item)}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-[#a09dab] hover:text-red-400 hover:bg-[#252033]"
                                                                    onClick={() => handleNotInterested(item)}
                                                                >
                                                                    <ThumbsDown className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#1a1625] border border-[#252033] rounded-2xl rounded-bl-md px-4 py-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#252033]">
                    {/* Quick Genre Chips */}
                    {messages.length <= 1 && (
                        <div className="max-w-4xl mx-auto mb-4">
                            <p className="text-xs text-[#6b6873] mb-2">Quick picks - tap a genre:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: "🎬 Action", query: "Recommend action movies" },
                                    { label: "😂 Comedy", query: "Recommend comedy movies" },
                                    { label: "😱 Horror", query: "Recommend horror movies" },
                                    { label: "🚀 Sci-Fi", query: "Recommend sci-fi movies" },
                                    { label: "💕 Romance", query: "Recommend romantic movies" },
                                    { label: "🔪 Thriller", query: "Recommend thriller movies" },
                                    { label: "📺 TV Shows", query: "Recommend popular TV shows" },
                                    { label: "🎭 Drama", query: "Recommend drama movies" },
                                ].map((chip) => (
                                    <button
                                        key={chip.label}
                                        onClick={() => {
                                            setInput(chip.query);
                                            setTimeout(() => {
                                                const event = { key: "Enter", shiftKey: false, preventDefault: () => { } };
                                                handleKeyPress(event as React.KeyboardEvent);
                                            }, 100);
                                        }}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-[#1a1625] border border-[#252033] rounded-full text-sm text-[#a09dab] hover:bg-violet-600/20 hover:text-violet-400 hover:border-violet-500/50 transition-all disabled:opacity-50"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask me anything about movies & shows..."
                            className="flex-1 bg-[#1a1625] border-[#252033] text-white placeholder:text-[#6b6873] focus:border-violet-500 focus:ring-violet-500 h-12 rounded-xl"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-violet-600 hover:bg-violet-500 h-12 w-12 rounded-xl"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                    <p className="text-center text-xs text-[#6b6873] mt-2">
                        Try: &quot;I like Nolan films&quot; or &quot;Something dark and thrilling&quot;
                    </p>
                </div>
            </div>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
