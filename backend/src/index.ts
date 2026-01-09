import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { connectDB } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    })
);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(config.port, () => {
            console.log(`🚀 CinePal Backend running on http://localhost:${config.port}`);
            console.log(`📚 Health check: http://localhost:${config.port}/api/health`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
