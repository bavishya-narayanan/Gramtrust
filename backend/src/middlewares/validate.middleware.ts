import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '@/utils/app-error';

export function validateRequest<TSchema extends ZodTypeAny>(schema: TSchema, target: 'body' | 'params' | 'query' = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      next(new AppError('Validation failed', 400, parsed.error.flatten()));
      return;
    }

    (req as Request & Record<string, unknown>)[target] = parsed.data as never;
    next();
  };
}