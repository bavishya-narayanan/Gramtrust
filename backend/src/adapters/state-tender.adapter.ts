import {
  GovernmentSourceAdapter,
  RawTenderRecord,
  TenderSearchFilters,
  TenderSearchResult,
} from './government-source.adapter.js';

export class StateTenderAdapter implements GovernmentSourceAdapter {
  readonly sourceId = 'STATE_EPROC';
  readonly sourceName = 'State e-Procurement Portals (MahaTenders / UP eTenders)';
  readonly baseUrl = 'https://mahatenders.gov.in';
  readonly isLiveApiAvailable = false;

  private mockRecords: RawTenderRecord[] = [];

  constructor(records?: RawTenderRecord[]) {
    if (records) this.mockRecords = records;
  }

  async searchTenders(_filters: TenderSearchFilters): Promise<TenderSearchResult[]> {
    return this.mockRecords.map((t) => ({
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
      bidsCount: t.bids?.length || 0,
      hasAwardData: !!t.awardDetails,
    }));
  }

  async getTenderDetails(tenderId: string): Promise<RawTenderRecord | null> {
    return this.mockRecords.find((t) => t.tenderId === tenderId) || null;
  }

  async fetchAllAvailable(limit = 100): Promise<RawTenderRecord[]> {
    return this.mockRecords.slice(0, limit);
  }

  async importDataset(rawContent: string, format: 'json' | 'csv'): Promise<RawTenderRecord[]> {
    if (format === 'json') {
      const parsed = JSON.parse(rawContent);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    throw new Error('CSV parsing not implemented for StateTenderAdapter');
  }
}
