import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler<TParams = Record<string, string>, TBody = unknown, TQuery = Record<string, string>>(
  fn: (req: Request<TParams, unknown, TBody, TQuery>, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req as Request<TParams, unknown, TBody, TQuery>, res, next).catch(next);
  };
}
