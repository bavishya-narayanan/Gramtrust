import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.js';
import { GovernmentAdapterFactory } from '@/adapters/adapter.factory.js';
import { versionService } from '@/services/version.service.js';
import { snapshotRepository } from '@/repositories/snapshot.repository.js';
import { AppError } from '@/utils/app-error.js';

export const sourceController = {
  getAdapters: asyncHandler(async (_req: Request, res: Response) => {
    const adapters = GovernmentAdapterFactory.getAllAdapters();
    res.json({ success: true, data: adapters });
  }),

  searchCatalog: asyncHandler(async (req: Request, res: Response) => {
    const sourceId = (req.query.sourceId as string) || 'CPPP_EPROCURE';
    const adapter = GovernmentAdapterFactory.getAdapter(sourceId);

    const filters = {
      query: (req.query.query as string) || undefined,
      department: (req.query.department as string) || undefined,
      state: (req.query.state as string) || undefined,
      status: (req.query.status as string) || undefined,
      minEstimatedValue: req.query.minValue ? Number(req.query.minValue) : undefined,
      maxEstimatedValue: req.query.maxValue ? Number(req.query.maxValue) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    };

    const results = await adapter.searchTenders(filters);
    res.json({
      success: true,
      data: {
        sourceId: adapter.sourceId,
        sourceName: adapter.sourceName,
        total: results.length,
        items: results,
      },
    });
  }),

  getCatalogTender: asyncHandler(async (req: Request, res: Response) => {
    const sourceId = (req.query.sourceId as string) || 'CPPP_EPROCURE';
    const tenderId = String(req.params.tenderId);
    const adapter = GovernmentAdapterFactory.getAdapter(sourceId);

    const record = await adapter.getTenderDetails(tenderId);
    if (!record) {
      throw new AppError(`Tender '${tenderId}' not found in government source '${adapter.sourceName}'`, 404);
    }

    res.json({ success: true, data: record });
  }),

  importTender: asyncHandler(async (req: Request, res: Response) => {
    const { sourceId, tenderId, rawRecord } = req.body;
    let recordToImport = rawRecord;

    if (!recordToImport && tenderId) {
      const adapter = GovernmentAdapterFactory.getAdapter(sourceId || 'CPPP_EPROCURE');
      recordToImport = await adapter.getTenderDetails(tenderId);
    }

    if (!recordToImport) {
      throw new AppError('No valid government record provided for import.', 400);
    }

    const imported = await versionService.importTender(recordToImport, {
      importedById: req.user?.sub || undefined,
      sourceName: recordToImport.sourceName,
      sourceUrl: recordToImport.sourceUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Government record successfully imported with immutable snapshot and V1 version.',
      data: {
        tenderId: imported.tender.tenderId,
        id: imported.tender.id,
        version: imported.tenderVersion.versionNumber,
        hash: imported.tenderVersion.newHash,
        snapshotId: imported.snapshot.id,
        snapshotSha256: imported.snapshot.sha256,
        fabricTxId: imported.fabricTxId,
      },
    });
  }),

  uploadDataset: asyncHandler(async (req: Request, res: Response) => {
    const { rawContent, format } = req.body;
    if (!rawContent) {
      throw new AppError('rawContent payload is required.', 400);
    }

    const adapter = GovernmentAdapterFactory.getAdapter('OFFICIAL_FILE_UPLOAD');
    const records = await adapter.importDataset(rawContent, format || 'json');

    res.json({
      success: true,
      message: `Parsed ${records.length} government tender record(s) from uploaded dataset.`,
      data: {
        count: records.length,
        records,
      },
    });
  }),

  getSnapshots: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const snapshots = await snapshotRepository.findAll(limit);
    res.json({ success: true, data: snapshots });
  }),

  getSnapshotById: asyncHandler(async (req: Request, res: Response) => {
    const snapshotId = String(req.params.id);
    const snapshot = await snapshotRepository.findById(snapshotId);
    if (!snapshot) {
      throw new AppError('Source snapshot not found.', 404);
    }
    res.json({ success: true, data: snapshot });
  }),
};
