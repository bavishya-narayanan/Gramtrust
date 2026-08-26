import type { ErrorRequestHandler } from 'express';
import { AppError } from '@/utils/app-error';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('[ERROR]', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null,
    });
    return;
  }

  // Handle PostgreSQL unique violation
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    res.status(409).json({ message: 'Duplicate record — already exists in database.' });
    return;
  }

  res.status(500).json({
    message: (error as Error)?.message ?? 'Internal server error',
  });
};
