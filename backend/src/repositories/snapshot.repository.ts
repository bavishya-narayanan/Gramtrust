import { prisma } from '@/config/prisma.js';
import { Prisma } from '@prisma/client';

export interface CreateSnapshotParams {
  sourceName: string;
  sourceUrl: string;
  resourceId?: string | null;
  rawData: unknown;
  sha256: string;
  recordCount?: number;
  status?: string;
  metadata?: unknown;
  importedById?: string | null;
}

export const snapshotRepository = {
  async create(params: CreateSnapshotParams) {
    return prisma.sourceSnapshot.create({
      data: {
        sourceName: params.sourceName,
        sourceUrl: params.sourceUrl,
        resourceId: params.resourceId || null,
        rawData: params.rawData as Prisma.InputJsonValue,
        sha256: params.sha256,
        recordCount: params.recordCount ?? 1,
        status: params.status ?? 'VALID',
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        importedById: params.importedById || null,
      },
    });
  },

  async findById(id: string) {
    return prisma.sourceSnapshot.findUnique({
      where: { id },
      include: {
        importedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  },

  async findBySha256(sha256: string) {
    return prisma.sourceSnapshot.findFirst({
      where: { sha256 },
    });
  },

  async findAll(limit = 50) {
    return prisma.sourceSnapshot.findMany({
      orderBy: { fetchTimestamp: 'desc' },
      take: limit,
      include: {
        importedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { tenders: true },
        },
      },
    });
  },
};
