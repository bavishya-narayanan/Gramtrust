import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { blockchainService } from '@/services/blockchain.service';

export const blockchainController = {
  store: asyncHandler(async (req: Request, res: Response) => {
    if (typeof req.body.projectCode === 'string' && req.body.projectCode.trim().length > 0) {
      const record = await blockchainService.storeByCode(req.body.projectCode.trim().toUpperCase());
      res.status(201).json({ message: 'Record stored on blockchain', data: record });
      return;
    }

    const projects = await blockchainService.storeAll();
    res.status(201).json({ message: 'Records stored on blockchain', data: projects, count: projects.length });
  }),

  history: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const history = await blockchainService.history(req.params.id);
    res.json({ data: history, count: history.length });
  }),
};
