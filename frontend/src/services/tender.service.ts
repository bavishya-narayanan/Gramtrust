import { apiClient } from '@/lib/api-client';
import type {
  Tender,
  TenderStats,
  TenderVersion,
  Bid,
  TenderAuditEvent,
  SourceSnapshot,
  IntegrityVerificationReport,
  GovernmentSourceInfo,
  CatalogTenderItem,
  Vendor,
} from '@/types/tender';

export const tenderService = {
  async getTenders(params?: {
    query?: string;
    department?: string;
    state?: string;
    district?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    offset?: number;
  }) {
    const res = await apiClient.get<{
      success: boolean;
      data: { total: number; limit: number; offset: number; items: Tender[] };
    }>('/tenders', { params });
    return res.data.data;
  },

  async getStats() {
    const res = await apiClient.get<{ success: boolean; data: TenderStats }>('/tenders/stats');
    return res.data.data;
  },

  async getTenderById(id: string) {
    const res = await apiClient.get<{ success: boolean; data: Tender }>(`/tenders/${id}`);
    return res.data.data;
  },

  async getTenderVersions(id: string) {
    const res = await apiClient.get<{ success: boolean; data: TenderVersion[] }>(`/tenders/${id}/versions`);
    return res.data.data;
  },

  async getTenderBids(id: string) {
    const res = await apiClient.get<{ success: boolean; data: Bid[] }>(`/tenders/${id}/bids`);
    return res.data.data;
  },

  async getTenderAudit(id: string) {
    const res = await apiClient.get<{ success: boolean; data: TenderAuditEvent[] }>(`/tenders/${id}/audit`);
    return res.data.data;
  },

  async getTenderSource(id: string) {
    const res = await apiClient.get<{ success: boolean; data: SourceSnapshot }>(`/tenders/${id}/source`);
    return res.data.data;
  },

  async verifyTender(id: string) {
    const res = await apiClient.get<{ success: boolean; data: IntegrityVerificationReport }>(`/tenders/${id}/verify`);
    return res.data.data;
  },


  async createVersion(id: string, payload: { changeReason: string; fields: Record<string, any> }) {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
      `/tenders/${id}/versions`,
      payload
    );
    return res.data;
  },

  async modifyBid(
    tenderId: string,
    bidId: string,
    payload: { changeReason: string; newBidAmount: number; newStatus?: string }
  ) {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
      `/tenders/${tenderId}/bids/${bidId}/versions`,
      payload
    );
    return res.data;
  },

  async simulateTampering(id: string) {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
      '/actions/simulate-tender-tampering',
      { tenderId: id }
    );
    return res.data;
  },

  // Vendors
  async getVendors() {
    const res = await apiClient.get<{ success: boolean; data: Vendor[] }>('/vendors');
    return res.data.data;
  },

  async getVendorById(id: string) {
    const res = await apiClient.get<{ success: boolean; data: Vendor & { metrics: any } }>(`/vendors/${id}`);
    return res.data.data;
  },

  // Government Sources
  async getGovAdapters() {
    const res = await apiClient.get<{ success: boolean; data: GovernmentSourceInfo[] }>('/sources/adapters');
    return res.data.data;
  },

  async searchGovCatalog(params?: {
    sourceId?: string;
    query?: string;
    department?: string;
    state?: string;
    status?: string;
    minValue?: number;
    maxValue?: number;
    limit?: number;
    offset?: number;
  }) {
    const res = await apiClient.get<{
      success: boolean;
      data: { sourceId: string; sourceName: string; total: number; items: CatalogTenderItem[] };
    }>('/sources/catalog', { params });
    return res.data.data;
  },

  async getGovCatalogTender(tenderId: string, sourceId?: string) {
    const res = await apiClient.get<{ success: boolean; data: any }>(`/sources/catalog/${tenderId}`, {
      params: { sourceId },
    });
    return res.data.data;
  },

  async importGovTender(payload: { sourceId?: string; tenderId?: string; rawRecord?: any }) {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
      '/sources/import',
      payload
    );
    return res.data;
  },

  async uploadGovDataset(payload: { rawContent: string; format?: 'json' | 'csv' }) {
    const res = await apiClient.post<{ success: boolean; message: string; data: { count: number; records: any[] } }>(
      '/sources/upload',
      payload
    );
    return res.data;
  },

  async getSnapshots() {
    const res = await apiClient.get<{ success: boolean; data: SourceSnapshot[] }>('/sources/snapshots');
    return res.data.data;
  },

  async getSnapshotById(id: string) {
    const res = await apiClient.get<{ success: boolean; data: SourceSnapshot }>(`/sources/snapshots/${id}`);
    return res.data.data;
  },
};
