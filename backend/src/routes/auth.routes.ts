import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models';
import { config } from '../config/env';
import { ApiError } from '../middleware';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Helper function to generate tokens
const generateTokens = (userId: string, email: string) => {
    const accessToken = jwt.sign(
        { userId, email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
        { userId, email },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const { email, password, name } = validation.data;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Create new user
        const user = new User({
            email,
            passwordHash: password,
            name,
        });
        await user.save();

        // Generate tokens
        const tokens = generateTokens(user._id.toString(), user.email);

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
            ...tokens,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const { email, password } = validation.data;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Check password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Generate tokens
        const tokens = generateTokens(user._id.toString(), user.email);

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                preferences: user.preferences,
                quizStats: user.quizStats,
            },
            ...tokens,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        try {
            const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
                userId: string;
                email: string;
            };

            // Generate new access token
            const accessToken = jwt.sign(
                { userId: decoded.userId, email: decoded.email },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );

            res.status(200).json({ accessToken });
        } catch {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
    // In a real app, you might invalidate the refresh token in a blacklist
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export default router;
