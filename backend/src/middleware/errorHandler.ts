import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }

    // MongoDB duplicate key error
    if ((err as { code?: number }).code === 11000) {
        res.status(409).json({
            success: false,
            error: 'Duplicate entry',
        });
        return;
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.message,
        });
        return;
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
};
