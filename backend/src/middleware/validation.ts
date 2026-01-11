import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Generic validation middleware factory
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
            return;
        }
        req.body = result.data;
        next();
    };
};

export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
            return;
        }
        Object.assign(req.query, result.data);
        next();
    };
};

export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid path parameters',
                details: result.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
            return;
        }
        Object.assign(req.params, result.data);
        next();
    };
};
