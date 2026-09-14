import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.js';
import { vendorRepository } from '@/repositories/vendor.repository.js';
import { AppError } from '@/utils/app-error.js';

export const vendorController = {
  getVendors: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 1000;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const { vendors, total } = await vendorRepository.findAll(limit, offset);

    const enriched = vendors.map((v) => {
      const totalBids = v._count.bids;
      const wonBids = v.bids.filter(
        (b) => b.status === 'Accepted' || b.status.toLowerCase().includes('awarded')
      );
      const totalWon = wonBids.length;
      const winPercentage = totalBids > 0 ? (totalWon / totalBids) * 100 : 0;
      const totalAwardedValue = wonBids.reduce((acc, b) => acc + Number(b.bidAmount), 0);

      return {
        id: v.id,
        name: v.name,
        gstin: v.gstin,
        state: v.state,
        district: v.district,
        isBlacklisted: v.isBlacklisted,
        currentVersionNumber: v.currentVersionNumber,
        totalParticipated: totalBids,
        totalWon,
        winPercentage: Number(winPercentage.toFixed(1)),
        totalAwardedValue,
      };
    });

    res.json({ success: true, data: enriched, total, limit, offset });
  }),

  getVendorById: asyncHandler(async (req: Request, res: Response) => {
    const vendorId = String(req.params.id);
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found.', 404);
    }

    const totalBids = vendor.bids.length;
    const wonBids = vendor.bids.filter(
      (b) => b.status === 'Accepted' || b.status.toLowerCase().includes('awarded')
    );
    const totalWon = wonBids.length;
    const winPercentage = totalBids > 0 ? (totalWon / totalBids) * 100 : null;
    const totalAwardedValue = wonBids.reduce((acc, b) => acc + Number(b.bidAmount), 0);

    res.json({
      success: true,
      data: {
        ...vendor,
        metrics: {
          totalParticipated: totalBids,
          totalWon,
          winPercentage: winPercentage !== null ? Number(winPercentage.toFixed(1)) : null,
          totalAwardedValue: totalWon > 0 ? totalAwardedValue : null,
          hasSufficientData: totalBids > 0,
        },
      },
    });
  }),
};
