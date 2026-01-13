/**
 * API Client for ReelMind Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('reelmind_token', token);
        } else {
            localStorage.removeItem('reelmind_token');
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('reelmind_token');
        }
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error || 'Request failed' };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Auth endpoints
    async register(email: string, password: string, name: string) {
        return this.request<{ user: User; accessToken: string; refreshToken: string }>(
            '/auth/register',
            { method: 'POST', body: JSON.stringify({ email, password, name }) }
        );
    }

    async login(email: string, password: string) {
        return this.request<{ user: User; accessToken: string; refreshToken: string }>(
            '/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password }) }
        );
    }

    async getMe() {
        return this.request<{ user: User }>('/auth/me');
    }

    async updateProfile(data: { name?: string; avatarUrl?: string; preferences?: UserPreferences }) {
        return this.request<{ user: User }>('/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Watch History endpoints
    async getWatchHistory(params?: { status?: string; type?: string; sort?: string }) {
        const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return this.request<{ items: WatchEntry[]; total: number }>(`/history${queryString}`);
    }

    async addOrUpdateWatch(entry: Partial<WatchEntry>) {
        return this.request<{ entry: WatchEntry; created: boolean }>('/history', {
            method: 'POST',
            body: JSON.stringify(entry),
        });
    }

    async updateWatchEntry(id: string, updates: Partial<WatchEntry>) {
        return this.request<{ entry: WatchEntry }>(`/history/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteWatchEntry(id: string) {
        return this.request<{ message: string }>(`/history/${id}`, { method: 'DELETE' });
    }

    async getWatchStats() {
        return this.request<WatchStats>('/history/stats');
    }

    async getAllQuotes() {
        return this.request<{ quotes: SavedQuote[] }>('/history/quotes');
    }

    async addQuote(entryId: string, quote: { quote: string; character: string; season?: number; episode?: number }) {
        return this.request<{ entry: WatchEntry }>(`/history/${entryId}/quotes`, {
            method: 'POST',
            body: JSON.stringify(quote),
        });
    }

    // Chat endpoints
    async sendMessage(message: string, conversationId?: string) {
        return this.request<{ response: string; type: string; conversationId: string; metadata: Record<string, unknown> }>(
            '/chat/message',
            { method: 'POST', body: JSON.stringify({ message, conversationId }) }
        );
    }

    async getConversations() {
        return this.request<{ conversations: Conversation[] }>('/chat/conversations');
    }

    async newConversation() {
        return this.request<{ conversation: Conversation }>('/chat/conversations', { method: 'POST' });
    }

    async getConversation(id: string) {
        return this.request<{ conversation: Conversation }>(`/chat/conversations/${id}`);
    }

    async getChatHistory() {
        return this.request<{ conversation: Conversation }>('/chat/history');
    }

    async clearChatHistory() {
        return this.request<{ message: string }>('/chat/history', { method: 'DELETE' });
    }

    // Content/Discovery endpoints
    async discoverContent(params: {
        type?: 'Movies' | 'Series' | 'All';
        sortBy?: 'Popular' | 'Top' | 'Top Rated' | 'Latest' | 'Trending';
        genre?: string;
        page?: number;
        query?: string;
    }) {
        if (params.query?.trim()) {
            let type: 'movie' | 'series' | 'all' = 'movie';
            if (params.type === 'Series') type = 'series';
            else if (params.type === 'All') type = 'all';

            return this.searchContent(params.query, type, params.page);
        }

        const queryString = new URLSearchParams(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
        ).toString();
        return this.request<DiscoverResponse>(`/content/discover?${queryString}`);
    }

    async getContentDetails(id: number, type: 'movie' | 'series') {
        return this.request<{ data: ContentDetails }>(`/content/${id}?type=${type}`);
    }

    async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all') {
        return this.request<DiscoverResponse>(`/content/trending?mediaType=${mediaType}`);
    }

    async searchContent(query: string, type: 'movie' | 'series' | 'all' = 'movie', page: number = 1) {
        return this.request<DiscoverResponse>(`/content/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}`);
    }

    async aiSearch(query: string) {
        return this.request<DiscoverResponse>('/content/ai-search', {
            method: 'POST',
            body: JSON.stringify({ query }),
        });
    }

    async submitQuiz(data: {
        showId: number;
        showTitle: string;
        difficulty: string;
        score: number;
        totalQuestions: number;
        questions?: any[];
        timeTaken?: number;
    }) {
        return this.request<{ xpEarned: number; totalXP: number; score: any }>('/quiz/submit', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCompletedQuizzes() {
        return this.request<{ showId: number; difficulty: string }[]>('/quiz/completed');
    }
}

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    stats: {
        totalXP: number;
        level: number;
        quizStreak: number;
        showsWatched: number;
        hoursWatched: number;
    };
    preferences?: UserPreferences;
}

export interface UserPreferences {
    favoriteGenres: string[];
    dislikedGenres: string[];
    preferredPlatforms: string[];
}

export interface WatchEntry {
    _id: string;
    userId: string;
    tmdbId: number;
    title: string;
    type: 'movie' | 'series';
    platform: string;
    status: 'watching' | 'completed' | 'dropped' | 'want_to_watch';
    progress?: {
        season?: number;
        episode?: number;
        percentage?: number;
    };
    rating?: number;
    notes?: string;
    genres: string[];
    posterUrl?: string;
    backdropUrl?: string;
    savedQuotes: SavedQuote[];
    firstWatchedAt: string;
    lastWatchedAt: string;
}

export interface SavedQuote {
    quote: string;
    character: string;
    season?: number;
    episode?: number;
    addedAt: string;
    showTitle?: string;
    showId?: number;
}

export interface WatchStats {
    overview: {
        completed: number;
        watching: number;
        wantToWatch: number;
        total: number;
    };
    topGenres: { genre: string; count: number }[];
    platforms: { platform: string; count: number }[];
    userStats: User['stats'];
}

export interface Conversation {
    _id: string;
    isActive: boolean;
    lastInteractionAt: string;
    createdAt: string;
    messages?: Message[];
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        type?: string;
        toolsUsed?: string[];
        showId?: number;
        contentCards?: ContentItem[];
        suggestedReplies?: { label: string; icon: string }[];
    };
}

// Content/Discovery types
export interface ContentItem {
    id: number;
    title: string;
    overview: string;
    posterUrl: string | null;
    backdropUrl: string | null;
    rating: number;
    year: string;
    type: 'movie' | 'series';
    genres: number[] | string[];
}

export interface ContentDetails extends ContentItem {
    runtime: number | null;
    directors: string[];
    cast: string[];
}

export interface DiscoverResponse {
    results: ContentItem[];
    totalPages: number;
    totalResults: number;
    page: number;
}

// Singleton instance
export const api = new ApiClient();
