import { prisma } from '@/config/prisma.js';
import { Prisma } from '@prisma/client';

export interface TenderQueryFilters {
  query?: string | undefined;
  department?: string | undefined;
  state?: string | undefined;
  district?: string | undefined;
  status?: string | undefined;

  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export const tenderRepository = {
  async findById(id: string) {
    return prisma.tender.findFirst({
      where: {
        OR: [{ id }, { tenderId: id }],
      },
      include: {
        snapshot: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            snapshot: {
              select: { id: true, sourceName: true, sourceUrl: true, sha256: true },
            },
          },
        },
        bids: {
          orderBy: { bidAmount: 'asc' },
          include: {
            vendor: true,
            versions: {
              orderBy: { versionNumber: 'desc' },
            },
          },
        },
        auditEvents: {
          orderBy: { createdAt: 'desc' },
        },

        blockchainTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  async findManyWithFilters(filters: TenderQueryFilters) {
    const where: Prisma.TenderWhereInput = {};

    if (filters.query) {
      where.OR = [
        { tenderId: { contains: filters.query, mode: 'insensitive' } },
        { referenceNumber: { contains: filters.query, mode: 'insensitive' } },
        { title: { contains: filters.query, mode: 'insensitive' } },
        { department: { contains: filters.query, mode: 'insensitive' } },
        { district: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.department) {
      where.department = { contains: filters.department, mode: 'insensitive' };
    }
    if (filters.state) {
      where.state = { equals: filters.state, mode: 'insensitive' };
    }
    if (filters.district) {
      where.district = { equals: filters.district, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = { equals: filters.status, mode: 'insensitive' };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.estimatedValue = {};
      if (filters.minAmount !== undefined) where.estimatedValue.gte = new Prisma.Decimal(filters.minAmount);
      if (filters.maxAmount !== undefined) where.estimatedValue.lte = new Prisma.Decimal(filters.maxAmount);
    }

    const [total, tenders] = await Promise.all([
      prisma.tender.count({ where }),
      prisma.tender.findMany({
        where,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { bids: true, versions: true, auditEvents: true },
          },
          bids: {
            select: {
              vendorName: true,
              bidAmount: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return { total, tenders };
  },

  async updateBlockchainStatus(
    tenderId: string,
    data: { blockchainStatus: string; blockchainTxId?: string; blockchainVerified?: boolean }
  ) {
    return prisma.tender.update({
      where: { id: tenderId },
      data,
    });
  },
};
