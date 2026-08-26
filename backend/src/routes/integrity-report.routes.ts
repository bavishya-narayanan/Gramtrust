import { Router } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { verifyService } from '@/services/verify.service';

export const integrityReportRoutes = Router();

integrityReportRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const report = await verifyService.report();
    res.json({ data: report });
  }),
);