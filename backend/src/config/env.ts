import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 8000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cinepal',
    jwtSecret: process.env.JWT_SECRET || 'cinepal-jwt-secret-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'cinepal-refresh-secret-change-in-production',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    nodeEnv: process.env.NODE_ENV || 'development',
};
