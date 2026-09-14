import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  GovernmentSourceAdapter,
  RawTenderRecord,
  TenderSearchFilters,
  TenderSearchResult,
} from './government-source.adapter.js';

export class CPPPAdapter implements GovernmentSourceAdapter {
  readonly sourceId = 'CPPP_EPROCURE';
  readonly sourceName = 'Central Public Procurement Portal (eProcure)';
  readonly baseUrl = 'https://eprocure.gov.in/eprocure/app';
  readonly isLiveApiAvailable = false;

  private async loadOfficialDataset(): Promise<RawTenderRecord[]> {
    try {
      const datasetPath = join(process.cwd(), '../datasets/cppp_panchayat_tenders.json');
      const data = await readFile(datasetPath, 'utf8');
      return JSON.parse(data) as RawTenderRecord[];
    } catch {
      try {
        const fallbackPath = join(process.cwd(), 'datasets/cppp_panchayat_tenders.json');
        const data = await readFile(fallbackPath, 'utf8');
        return JSON.parse(data) as RawTenderRecord[];
      } catch (err) {
        console.error('Failed to load CPPP dataset from disk:', err);
        return [];
      }
    }
  }

  async searchTenders(filters: TenderSearchFilters): Promise<TenderSearchResult[]> {
    const dataset = await this.loadOfficialDataset();
    let results = dataset;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (t) =>
          t.tenderTitle.toLowerCase().includes(q) ||
          t.tenderId.toLowerCase().includes(q) ||
          t.tenderReferenceNumber.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.district.toLowerCase().includes(q)
      );
    }

    if (filters.tenderId) {
      results = results.filter((t) => t.tenderId.toLowerCase() === filters.tenderId?.toLowerCase());
    }

    if (filters.department) {
      results = results.filter((t) =>
        t.department.toLowerCase().includes(filters.department!.toLowerCase())
      );
    }

    if (filters.state) {
      results = results.filter((t) => t.state.toLowerCase() === filters.state?.toLowerCase());
    }

    if (filters.status) {
      results = results.filter((t) => t.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters.minEstimatedValue !== undefined) {
      results = results.filter((t) => t.estimatedValue >= filters.minEstimatedValue!);
    }

    if (filters.maxEstimatedValue !== undefined) {
      results = results.filter((t) => t.estimatedValue <= filters.maxEstimatedValue!);
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = results.slice(offset, offset + limit);

    return paginated.map((t) => ({
      tenderId: t.tenderId,
      tenderReferenceNumber: t.tenderReferenceNumber,
      tenderTitle: t.tenderTitle,
      department: t.department,
      state: t.state,
      district: t.district,
      estimatedValue: t.estimatedValue,
      currency: t.currency || 'INR',
      status: t.status,
      publishedDate: t.publishedDate || undefined,
      closingDate: t.bidSubmissionClosingDate || undefined,
      sourceName: this.sourceName,
      sourceUrl: t.sourceUrl,
      bidsCount: t.bids?.length || t.bidsCount || 0,
      hasAwardData: !!t.awardDetails,
    }));
  }

  async getTenderDetails(tenderId: string): Promise<RawTenderRecord | null> {
    const dataset = await this.loadOfficialDataset();
    const found = dataset.find((t) => t.tenderId === tenderId);
    return found || null;
  }

  async fetchAllAvailable(limit = 100): Promise<RawTenderRecord[]> {
    const dataset = await this.loadOfficialDataset();
    return dataset.slice(0, limit);
  }

  async importDataset(rawContent: string, format: 'json' | 'csv'): Promise<RawTenderRecord[]> {
    if (format === 'json') {
      const parsed = JSON.parse(rawContent);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    throw new Error('CSV parsing for CPPP format requires standard header schema');
  }
}
