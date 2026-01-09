import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser } from '../models';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as {
                userId: string;
                email: string;
            };
            req.user = decoded;
            next();
        } catch (err) {
            res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        next(error);
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, config.jwtSecret) as {
                    userId: string;
                    email: string;
                };
                req.user = decoded;
            } catch {
                // Token invalid, continue without user
            }
        }
        next();
    } catch (error) {
        next(error);
    }
};
