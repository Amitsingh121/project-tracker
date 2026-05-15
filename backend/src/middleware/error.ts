import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    const body: Record<string, unknown> = {
      success: false,
      error: { message: err.message, code: err.code },
    };
    if (err.details) (body.error as Record<string, unknown>).details = err.details;
    return res.status(err.status).json(body);
  }

  const prismaErr = err as { code?: string };

  if (prismaErr.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { message: 'Resource already exists', code: 'CONFLICT' },
    });
  }

  if (prismaErr.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { message: 'Resource not found', code: 'NOT_FOUND' },
    });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 'SERVER_ERROR' },
  });
};
