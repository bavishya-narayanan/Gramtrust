import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { projectService } from '@/services/project.service';
import { blockchainService } from '@/services/blockchain.service';
import { tamperLogService } from '@/services/tamper-log.service';
import { AppError } from '@/utils/app-error';

export const projectController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const projects = await projectService.list();
    res.json({ data: projects, count: projects.length });
  }),

  getById: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const project = await projectService.getByCode(req.params.id);
    res.json({ data: project });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user?.role === 'CITIZEN') {
      throw new AppError('Access denied. Citizens cannot create financial records.', 403);
    }
    const project = await projectService.create(req.body);
    res.status(201).json({ message: 'Project created', data: project });
  }),

  update: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const user = (req as any).user;
    if (user?.role === 'CITIZEN') {
      await tamperLogService.logUnauthorizedAttempt(
        user,
        req.params.id,
        'amount',
        req.body.amount,
      );
      throw new AppError('Access denied. Citizens cannot modify financial records.', 403);
    }
    const project = await projectService.update(req.params.id, req.body, user);
    res.json({ message: 'Project updated', data: project });
  }),

  remove: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const user = (req as any).user;
    if (user?.role === 'CITIZEN') {
      throw new AppError('Access denied. Citizens cannot delete financial records.', 403);
    }
    await projectService.remove(req.params.id);
    res.status(204).send();
  }),

  verify: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const result = await projectService.verify(req.params.id);
    res.json({ message: 'Project verified', data: result });
  }),

  history: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const history = await blockchainService.history(req.params.id);
    res.json({ data: history, count: history.length });
  }),
};

