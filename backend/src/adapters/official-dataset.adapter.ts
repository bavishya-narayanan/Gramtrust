import { parse } from 'csv-parse/sync';
import {
  GovernmentSourceAdapter,
  RawTenderRecord,
  TenderSearchFilters,
  TenderSearchResult,
} from './government-source.adapter.js';

export class OfficialDatasetAdapter implements GovernmentSourceAdapter {
  readonly sourceId = 'OFFICIAL_FILE_UPLOAD';
  readonly sourceName = 'Official Government Dataset Upload (CSV / JSON)';
  readonly baseUrl = 'https://eprocure.gov.in';
  readonly isLiveApiAvailable = false;

  private records: RawTenderRecord[] = [];

  constructor(initialRecords: RawTenderRecord[] = []) {
    this.records = initialRecords;
  }

  async searchTenders(_filters: TenderSearchFilters): Promise<TenderSearchResult[]> {
    return this.records.map((t) => ({
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
      sourceName: t.sourceName || this.sourceName,
      sourceUrl: t.sourceUrl,
      bidsCount: t.bids?.length || t.bidsCount || 0,
      hasAwardData: !!t.awardDetails,
    }));
  }

  async getTenderDetails(tenderId: string): Promise<RawTenderRecord | null> {
    return this.records.find((t) => t.tenderId === tenderId) || null;
  }

  async fetchAllAvailable(limit = 100): Promise<RawTenderRecord[]> {
    return this.records.slice(0, limit);
  }

  async importDataset(rawContent: string, format: 'json' | 'csv'): Promise<RawTenderRecord[]> {
    if (format === 'json') {
      const parsed = JSON.parse(rawContent);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      this.records = list;
      return list;
    } else if (format === 'csv') {
      const records = parse(rawContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      const normalized: RawTenderRecord[] = records.map((r, index) => ({
        tenderId: r.tenderId || r['Tender ID'] || `GOV-TDR-${Date.now()}-${index}`,
        tenderReferenceNumber: r.tenderReferenceNumber || r['Reference Number'] || `REF-${index}`,
        tenderTitle: r.tenderTitle || r['Work Description'] || r['Title'] || 'Government Procurement Work',
        department: r.department || r['Department'] || 'Department of Rural Development',
        organisationChain: r.organisationChain || r['Organisation Chain'] || undefined,
        tenderType: r.tenderType || r['Tender Type'] || 'Open Tender',
        tenderCategory: r.tenderCategory || r['Tender Category'] || 'Works',
        formOfContract: r.formOfContract || r['Form of Contract'] || undefined,
        productCategory: r.productCategory || r['Product Category'] || 'Civil Works',
        location: r.location || r['Location'] || undefined,
        pincode: r.pincode || r['Pincode'] || undefined,
        state: r.state || r['State'] || 'National',
        district: r.district || r['District'] || 'General',
        panchayat: r.panchayat || r['Gram Panchayat'] || undefined,
        estimatedValue: Number(r.estimatedValue || r['Tender Value'] || r['Estimated Cost'] || 0),
        currency: r.currency || 'INR',
        publishedDate: r.publishedDate || r['Publish Date'] || new Date().toISOString(),
        bidSubmissionStartDate: r.bidSubmissionStartDate || r['Bid Submission Start Date'] || undefined,
        bidSubmissionClosingDate: r.bidSubmissionClosingDate || r['Bid Submission Closing Date'] || undefined,
        bidOpeningDate: r.bidOpeningDate || r['Bid Opening Date'] || undefined,
        status: r.status || r['Tender Status'] || 'Published',
        sourceUrl: r.sourceUrl || r['Source URL'] || 'https://eprocure.gov.in',
        sourceName: r.sourceName || r['Source'] || this.sourceName,
        sourceDatasetId: r.sourceDatasetId || r['Dataset ID'] || undefined,
        invitingAuthority: r.invitingAuthority || r['Tender Inviting Authority'] || undefined,
        periodOfWorkDays: r.periodOfWorkDays ? Number(r.periodOfWorkDays) : undefined,
        bidsCount: 0,
        bids: [],
        awardDetails: null,
      }));

      this.records = normalized;
      return normalized;
    }
    throw new Error(`Unsupported format: ${format}`);
  }
}
