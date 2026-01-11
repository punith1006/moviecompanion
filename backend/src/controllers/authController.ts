import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models';
import { config } from '../config/environment';
import { AppError, AuthRequest } from '../middleware';

// Validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Helper to generate tokens
function generateTokens(userId: string, email: string) {
    const accessOptions: SignOptions = { expiresIn: '7d' };
    const refreshOptions: SignOptions = { expiresIn: '30d' };

    const accessToken = jwt.sign(
        { userId, email },
        config.jwt.secret,
        accessOptions
    );

    const refreshToken = jwt.sign(
        { userId, email },
        config.jwt.refreshSecret,
        refreshOptions
    );

    return { accessToken, refreshToken };
}

// Register new user
export async function register(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('User with this email already exists', 409);
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            stats: {
                totalXP: 0,
                level: 1,
                quizStreak: 0,
                showsWatched: 0,
                hoursWatched: 0,
            },
            preferences: {
                favoriteGenres: [],
                dislikedGenres: [],
                preferredPlatforms: [],
            },
        });

        const tokens = generateTokens(user._id.toString(), user.email);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    stats: user.stats,
                },
                ...tokens,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Login user
export async function login(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new AppError('Invalid email or password', 401);
        }

        const tokens = generateTokens(user._id.toString(), user.email);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    stats: user.stats,
                },
                ...tokens,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        throw error;
    }
}

// Get current user
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
    res.json({
        success: true,
        data: {
            user: {
                id: req.user!._id,
                email: req.user!.email,
                name: req.user!.name,
                avatarUrl: req.user!.avatarUrl,
                stats: req.user!.stats,
                preferences: req.user!.preferences,
            },
        },
    });
}

// Refresh token
export async function refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            throw new AppError('Refresh token required', 400);
        }

        const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
            userId: string;
            email: string;
        };

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new AppError('User not found', 401);
        }

        const tokens = generateTokens(user._id.toString(), user.email);

        res.json({
            success: true,
            data: tokens,
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Refresh token expired',
            });
            return;
        }
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
        });
    }
}

// Update user profile
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { name, avatarUrl, preferences } = req.body;

        const updates: Record<string, unknown> = {};
        if (name) updates.name = name;
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
        if (preferences) updates.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            req.user!._id,
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user!._id,
                    email: user!.email,
                    name: user!.name,
                    avatarUrl: user!.avatarUrl,
                    stats: user!.stats,
                    preferences: user!.preferences,
                },
            },
        });
    } catch (error) {
        throw error;
    }
}
