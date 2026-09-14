import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.js';
import { tenderRepository } from '@/repositories/tender.repository.js';
import { versionService } from '@/services/version.service.js';
import { verifyService } from '@/services/verify.service.js';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/app-error.js';

export const tenderController = {
  getTenders: asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      query: (req.query.query as string) || undefined,
      department: (req.query.department as string) || undefined,
      state: (req.query.state as string) || undefined,
      district: (req.query.district as string) || undefined,
      status: (req.query.status as string) || undefined,

      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    };

    const { total, tenders } = await tenderRepository.findManyWithFilters(filters);
    res.json({
      success: true,
      data: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        items: tenders,
      },
    });
  }),

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const [totalTenders, activeTenders, awardedTenders, totalVendors, sumResult, tamperCount] =
      await Promise.all([
        prisma.tender.count(),
        prisma.tender.count({ where: { status: { in: ['Published', 'Active', 'Under Evaluation'] } } }),
        prisma.tender.count({ where: { status: 'Awarded' } }),
        prisma.vendor.count(),
        prisma.tender.aggregate({
          _sum: { estimatedValue: true },
        }),
        prisma.tenderAuditEvent.count({ where: { eventType: 'TAMPERING_DETECTED' } }),
      ]);

    const totalValue = Number(sumResult._sum.estimatedValue || 0);

    res.json({
      success: true,
      data: {
        totalTenders,
        activeTenders,
        awardedTenders,
        totalVendors,
        totalProcurementValue: totalValue,
        tamperAlerts: tamperCount,
      },
    });
  }),

  getTenderById: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const tender = await tenderRepository.findById(tenderId);
    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found.`, 404);
    }
    res.json({ success: true, data: tender });
  }),

  getVersions: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const tender = await tenderRepository.findById(tenderId);
    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found.`, 404);
    }
    res.json({ success: true, data: tender.versions });
  }),

  getBids: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const tender = await tenderRepository.findById(tenderId);
    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found.`, 404);
    }
    res.json({ success: true, data: tender.bids });
  }),

  getAuditHistory: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const tender = await tenderRepository.findById(tenderId);
    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found.`, 404);
    }
    res.json({ success: true, data: tender.auditEvents });
  }),

  getSource: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const tender = await tenderRepository.findById(tenderId);
    if (!tender) {
      throw new AppError(`Tender '${tenderId}' not found.`, 404);
    }
    res.json({ success: true, data: tender.snapshot });
  }),

  verifyIntegrity: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const report = await verifyService.verifyTender(tenderId);
    res.json({ success: true, data: report });
  }),

  createVersion: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const { changeReason, fields } = req.body;
    if (!changeReason) {
      throw new AppError('changeReason is required for official modifications.', 400);
    }
    if (!fields || Object.keys(fields).length === 0) {
      throw new AppError('At least one field must be modified to create a new version.', 400);
    }

    const changedBy = req.user?.name || req.user?.email || 'Authorized Official';
    const actorRole = req.user?.role || 'OFFICIAL';

    const result = await versionService.createTenderVersion({
      tenderId,
      changedBy,
      actorRole,
      changeReason,
      fields,
    });

    res.status(201).json({
      success: true,
      message: `Version ${result.newVersion.versionNumber} created successfully. Historical version ${result.newVersion.versionNumber - 1} remains untouched.`,
      data: result,
    });
  }),

  modifyBid: asyncHandler(async (req: Request, res: Response) => {
    const tenderId = String(req.params.id);
    const bidId = String(req.params.bidId);
    const { changeReason, newBidAmount, newStatus } = req.body;

    if (newBidAmount === undefined || isNaN(Number(newBidAmount))) {
      throw new AppError('Valid newBidAmount is required.', 400);
    }
    if (!changeReason) {
      throw new AppError('changeReason is required for bid modifications.', 400);
    }

    const changedBy = req.user?.name || req.user?.email || 'Authorized Official';
    const actorRole = req.user?.role || 'OFFICIAL';

    const result = await versionService.createBidVersion({
      bidId,
      tenderId,
      changedBy,
      actorRole,
      changeReason,
      newBidAmount: Number(newBidAmount),
      newStatus,
    });

    res.status(201).json({
      success: true,
      message: `Bid version ${result.newVersion.versionNumber} created. Original bid amount preserved in immutable history.`,
      data: result,
    });
  }),

};
