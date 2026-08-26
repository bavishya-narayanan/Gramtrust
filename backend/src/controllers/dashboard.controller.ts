import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { dashboardService } from '@/services/dashboard.service';

export const dashboardController = {
  getSummary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();
    res.json({ data: summary });
  }),
};