import { prisma } from '@/config/prisma.js';

export interface CreateVendorParams {
  name: string;
  gstin?: string | null;
  pan?: string | null;
  state?: string | null;
  district?: string | null;
  address?: string | null;
}

export const vendorRepository = {
  async upsert(params: CreateVendorParams) {
    if (params.gstin) {
      const existing = await prisma.vendor.findUnique({
        where: { gstin: params.gstin },
      });
      if (existing) {
        return existing;
      }
    } else {
      const existing = await prisma.vendor.findFirst({
        where: { name: params.name },
      });
      if (existing) {
        return existing;
      }
    }

    return prisma.vendor.create({
      data: {
        name: params.name,
        gstin: params.gstin || null,
        pan: params.pan || null,
        state: params.state || null,
        district: params.district || null,
        address: params.address || null,
      },
    });
  },

  async findById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        bids: {
          include: {
            tender: {
              select: {
                id: true,
                tenderId: true,
                title: true,
                department: true,
                status: true,
                estimatedValue: true,
                state: true,
                district: true,
              },
            },
          },
        },
      },
    });
  },

  async findAll(limit = 1000, offset = 0) {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { bids: true },
          },
          bids: {
            select: {
              bidAmount: true,
              status: true,
              tender: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.vendor.count(),
    ]);
    return { vendors, total };
  },
};
