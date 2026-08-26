import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { verifyService } from '@/services/verify.service';

export const verifyController = {
  verifyAll: asyncHandler(async (req: Request, res: Response) => {
    if (typeof req.body.projectCode === 'string' && req.body.projectCode.trim().length > 0) {
      const result = await verifyService.verifyProject(req.body.projectCode.trim().toUpperCase());
      res.json({ message: 'Verification completed', data: result });
      return;
    }

    const result = await verifyService.verifyAll();
    res.json({ message: 'Verification completed', data: result, count: result.length });
  }),

  report: asyncHandler(async (_req: Request, res: Response) => {
    const report = await verifyService.report();
    res.json({ data: report });
  }),
};
