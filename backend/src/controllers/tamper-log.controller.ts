import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { tamperLogService } from '@/services/tamper-log.service';

export const tamperLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { userId, userRole, changeType, status, dateFrom, dateTo, recordId, limit } = req.query as Record<string, string>;

    const logs = await tamperLogService.getLogs({
      userId,
      userRole,
      changeType,
      status,
      dateFrom,
      dateTo,
      recordId,
      limit: limit ? Number(limit) : 500,
    });

    const count = await tamperLogService.getCount();

    res.json({ data: logs, count });
  }),
};
