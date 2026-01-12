// Mock data for UI development - will be replaced with real API calls

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'recap' | 'recommendation' | 'quiz';
    metadata?: Record<string, unknown>;
}

export interface Show {
    id: string;
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
    watchedAt?: Date;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    funFact?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    stats: {
        totalXP: number;
        level: number;
        quizStreak: number;
        showsWatched: number;
        hoursWatched: number;
    };
}

// Mock user data
export const mockUser: User = {
    id: '1',
    name: 'Demo User',
    email: 'demo@reelmind.ai',
    avatarUrl: undefined,
    stats: {
        totalXP: 450,
        level: 4,
        quizStreak: 3,
        showsWatched: 12,
        hoursWatched: 156,
    },
};

// Mock watch history
export const mockWatchHistory: Show[] = [
    {
        id: '1',
        tmdbId: 1396,
        title: 'Breaking Bad',
        type: 'series',
        platform: 'Netflix',
        status: 'completed',
        rating: 5,
        notes: 'Masterpiece of television',
        genres: ['Drama', 'Crime', 'Thriller'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    },
    {
        id: '2',
        tmdbId: 76331,
        title: 'Succession',
        type: 'series',
        platform: 'HBO Max',
        status: 'watching',
        progress: { season: 2, episode: 3 },
        rating: 4,
        genres: ['Drama'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/wdhyOVJWcJR8Dqbp3i6u72jVl4G.jpg',
    },
    {
        id: '3',
        tmdbId: 136315,
        title: 'The Bear',
        type: 'series',
        platform: 'Hulu',
        status: 'watching',
        progress: { season: 1, episode: 5 },
        rating: 4,
        notes: 'Intense kitchen drama!',
        genres: ['Drama', 'Comedy'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/sHFlbKfE4ZzLUh4WPOEjS7Xbnzy.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/czF7AqJhPqoQXZVSMKWKTJCHGkh.jpg',
    },
    {
        id: '4',
        tmdbId: 95396,
        title: 'Severance',
        type: 'series',
        platform: 'Apple TV+',
        status: 'want_to_watch',
        genres: ['Thriller', 'Drama', 'Sci-Fi'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/lFfPbIcU1j2G7YHqrZfYDTYv7TM.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/6aFswHYGz4k7tNWAOC3tLqreK3B.jpg',
    },
    {
        id: '5',
        tmdbId: 97186,
        title: 'Ted Lasso',
        type: 'series',
        platform: 'Apple TV+',
        status: 'completed',
        rating: 5,
        notes: 'Feel-good perfection',
        genres: ['Comedy', 'Drama', 'Sport'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/b9UBtPo18iNnOqgybFAObSYHFIQ.jpg',
    },
    {
        id: '6',
        tmdbId: 1399,
        title: 'Game of Thrones',
        type: 'series',
        platform: 'HBO Max',
        status: 'completed',
        rating: 4,
        genres: ['Drama', 'Fantasy', 'Action'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
    },
];

// Mock recommendations
export const mockRecommendations: Show[] = [
    {
        id: 'rec1',
        tmdbId: 60574,
        title: 'Peaky Blinders',
        type: 'series',
        platform: 'Netflix',
        status: 'want_to_watch',
        genres: ['Crime', 'Drama'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/pE8CScObQURsFZ723PSW1K9EGYp.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/wiE9doxiLwq3WCGamDIOb2PqBqc.jpg',
    },
    {
        id: 'rec2',
        tmdbId: 63926,
        title: 'One Piece',
        type: 'series',
        platform: 'Netflix',
        status: 'want_to_watch',
        genres: ['Action', 'Adventure', 'Fantasy'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/rVX05xRKS5JhEYQFObCi4lAnZT4.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/qvZ91FwMq6O47VViAr8vZNQz3WI.jpg',
    },
    {
        id: 'rec3',
        tmdbId: 84773,
        title: 'The Lord of the Rings: The Rings of Power',
        type: 'series',
        platform: 'Prime Video',
        status: 'want_to_watch',
        genres: ['Fantasy', 'Drama', 'Action'],
        posterUrl: 'https://image.tmdb.org/t/p/w500/NNC08YmJFFlLi1prBkK8quk3dp.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/mYLOqiStMxDK3fYZFirgrMt8z5d.jpg',
    },
];

// Mock conversation
export const mockConversation: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: "Hey! I'm ReelMind, your personal entertainment companion. 🎬 I remember everything you watch. Tell me something you've seen recently, or ask me for recommendations!",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: 'text',
    },
];

// Mock quiz questions for Breaking Bad
export const mockQuizQuestions: QuizQuestion[] = [
    {
        id: 'q1',
        question: 'What is the street name Walter White uses in the drug trade?',
        options: ['Heisenberg', 'The Cook', 'Blue Sky', 'The Chemist'],
        correctIndex: 0,
        funFact: 'The name Heisenberg is a reference to the German physicist Werner Heisenberg, known for his uncertainty principle.',
    },
    {
        id: 'q2',
        question: 'What subject does Walter White teach at the beginning of the series?',
        options: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
        correctIndex: 1,
        funFact: 'Bryan Cranston actually studied chemistry to prepare for the role and learned to cook basic compounds.',
    },
    {
        id: 'q3',
        question: 'What is the name of Gustavo Fring\'s restaurant chain?',
        options: ['Pollos Hermanos', 'Los Pollos Locos', 'El Pollo Loco', 'Chicken Brothers'],
        correctIndex: 0,
        funFact: 'The Los Pollos Hermanos restaurants were actually built for the show and became so iconic that pop-up versions appeared in real life.',
    },
    {
        id: 'q4',
        question: 'What color is associated with the signature meth produced by Walter White?',
        options: ['Yellow', 'White', 'Blue', 'Green'],
        correctIndex: 2,
        funFact: 'The blue color was added for visual distinction on screen - in reality, pure methamphetamine is colorless.',
    },
    {
        id: 'q5',
        question: "What is Jesse Pinkman's iconic catchphrase?",
        options: ['"Yeah, bro!"', '"Science, bitch!"', '"Yo, Mr. White!"', '"Yeah, science!"'],
        correctIndex: 2,
        funFact: 'Aaron Paul\'s character was originally supposed to be killed off in Season 1, but his performance was so compelling that the writers kept him.',
    },
];

// Helper to generate unique IDs
export const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15);
};
