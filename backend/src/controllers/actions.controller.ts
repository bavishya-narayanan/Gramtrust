import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { env } from '@/config/env';
import { importService } from '@/services/import.service';
import { blockchainService } from '@/services/blockchain.service';
import { verifyService } from '@/services/verify.service';

export const actionsController = {
  importDataset: asyncHandler(async (_req: Request, res: Response) => {
    const projects = await importService.importFromFile(env.CSV_STORAGE_PATH);
    res.status(201).json({ message: 'Dataset imported', data: projects, count: projects.length });
  }),

  storeRecords: asyncHandler(async (_req: Request, res: Response) => {
    const projects = await blockchainService.storeAll();
    res.status(201).json({ message: 'Records stored on blockchain', data: projects, count: projects.length });
  }),

  simulateTampering: asyncHandler(async (_req: Request, res: Response) => {
    const tampered = await blockchainService.simulateTampering();
    res.status(201).json({ message: 'Tampering simulated', data: tampered });
  }),

  simulateTenderTampering: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = req.body?.tenderId || req.query?.tenderId ? String(req.body?.tenderId || req.query?.tenderId) : undefined;
    const result = await blockchainService.simulateTenderTampering(tenderId);
    res.status(201).json({ success: true, message: result.message, data: result });
  }),

  verifyBlockchain: asyncHandler(async (_req: Request, res: Response) => {
    const result = await verifyService.verifyAll();
    res.json({ message: 'Verification completed', data: result, count: result.length });
  }),
};