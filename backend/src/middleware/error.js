import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const body = { success: false, error: { message: err.message, code: err.code } };
    if (err.details) body.error.details = err.details;
    return res.status(err.status).json(body);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { message: 'Resource already exists', code: 'CONFLICT' },
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
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
