import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '8000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reelmind',

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    // AI Service
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',

    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

    // External APIs
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
};

// Validate required environment variables
export function validateEnv(): void {
    const required = ['JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0 && config.nodeEnv === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
