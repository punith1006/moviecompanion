import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { User, IUser } from '../models';

export interface AuthRequest extends Request {
    user?: IUser;
}

export interface JwtPayload {
    userId: string;
    email: string;
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required',
            });
            return;
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired',
            });
            return;
        }

        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (token) {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch {
        // Token invalid, continue without user
        next();
    }
};
