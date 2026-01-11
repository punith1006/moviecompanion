import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config, validateEnv } from './config/environment';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

// Validate environment
validateEnv();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO setup for real-time chat
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// API routes
app.use('/api', routes);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`Client ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Export io for use in controllers
export { io };

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Start listening
        httpServer.listen(config.port, () => {
            console.log(`
🎬 ReelMind Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${config.nodeEnv}
🚀 Server:      http://localhost:${config.port}
📚 API:         http://localhost:${config.port}/api
❤️  Health:      http://localhost:${config.port}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start the server
startServer();
