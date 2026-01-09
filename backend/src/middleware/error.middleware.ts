import { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler: ErrorRequestHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`❌ Error: ${message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export const notFoundHandler: RequestHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
    });
};

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
