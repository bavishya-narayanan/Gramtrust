import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import {
  GovernmentSourceAdapter,
  RawTenderRecord,
  TenderSearchFilters,
  TenderSearchResult,
} from './government-source.adapter.js';

export interface ProcurementCsvRow {
  tender_id: string;
  project_name: string;
  vendor_name: string;
  bid_amount: string;
  estimated_amount: string;
  status: string;
  submission_date?: string;
}

/**
 * Adapter that loads from the Kaggle-sourced procurement_tenders.csv dataset.
 * Groups rows by tender_id and builds full RawTenderRecord objects with bids.
 */
export class KaggleProcurementAdapter implements GovernmentSourceAdapter {
  readonly sourceId = 'KAGGLE_PROCUREMENT_CSV';
  readonly sourceName = 'Kaggle Indian Government Procurement Dataset (CSV)';
  readonly baseUrl = 'https://www.kaggle.com/datasets';
  readonly isLiveApiAvailable = false;

  private cached: RawTenderRecord[] | null = null;

  private async loadAndParseCSV(): Promise<RawTenderRecord[]> {
    if (this.cached) return this.cached;

    const paths = [
      join(process.cwd(), '../datasets/procurement_tenders.csv'),
      join(process.cwd(), 'datasets/procurement_tenders.csv'),
    ];

    let rawContent = '';
    for (const p of paths) {
      try {
        rawContent = await readFile(p, 'utf8');
        break;
      } catch {
        // try next path
      }
    }

    if (!rawContent) {
      console.warn('KaggleProcurementAdapter: procurement_tenders.csv not found');
      return [];
    }

    const rows = parse(rawContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ProcurementCsvRow[];

    this.cached = this.normalizeCsvToTenderRecords(rows);
    return this.cached;
  }

  /**
   * Groups CSV rows by tender_id. Each group becomes one RawTenderRecord
   * with all bids attached.
   */
  normalizeCsvToTenderRecords(rows: ProcurementCsvRow[]): RawTenderRecord[] {
    const tenderMap = new Map<string, RawTenderRecord>();

    for (const row of rows) {
      const tenderId = row.tender_id?.trim();
      if (!tenderId) continue;

      const estimatedAmount = Number(row.estimated_amount) || 0;
      const bidAmount = Number(row.bid_amount) || 0;
      const status = (row.status || 'SUBMITTED').trim().toUpperCase();
      const submissionDate = row.submission_date?.trim() || new Date().toISOString();

      if (!tenderMap.has(tenderId)) {
        const projectName = row.project_name?.trim() || `Government Project ${tenderId}`;
        // Extract district from "Project Name - District"
        const nameParts = projectName.split(' - ');
        const district = nameParts.length > 1 ? (nameParts[nameParts.length - 1] ?? 'General') : 'General';

        tenderMap.set(tenderId, {
          tenderId,
          tenderReferenceNumber: `REF-${tenderId}-2024`,
          tenderTitle: projectName,
          department: 'Department of Rural Development',
          organisationChain: 'Ministry of Panchayati Raj > State Government > District Administration',
          tenderType: 'Open Tender',
          tenderCategory: 'Works',
          formOfContract: 'Item Rate Contract',
          productCategory: 'Civil Works',
          state: 'India',
          district,
          panchayat: undefined,
          location: district,
          pincode: undefined,
          estimatedValue: estimatedAmount,
          currency: 'INR',
          publishedDate: submissionDate,
          bidSubmissionStartDate: submissionDate,
          bidSubmissionClosingDate: undefined,
          bidOpeningDate: undefined,
          status: status === 'AWARDED' ? 'Awarded' : status === 'ACTIVE' ? 'Active' : 'Published',
          sourceUrl: 'https://www.kaggle.com/datasets/indian-government-procurement',
          sourceName: this.sourceName,
          sourceDatasetId: `KAGGLE-PROCUREMENT-${tenderId}`,
          invitingAuthority: 'District Collector / Block Development Officer',
          periodOfWorkDays: 180,
          bidsCount: 0,
          bids: [],
          awardDetails: null,
        });
      }

      const tender = tenderMap.get(tenderId)!;
      const isWinner = status === 'AWARDED';

      // Bids in government-source.adapter require a bidId field
      const bidEntry = {
        bidId: `${tenderId}-${String(tender.bids!.length + 1).padStart(2, '0')}`,
        vendorName: row.vendor_name?.trim() || 'Unknown Vendor',
        vendorGstin: undefined as string | undefined,
        vendorState: undefined as string | undefined,
        bidAmount,
        submissionDate,
        technicalScore: undefined as number | undefined,
        financialRank: isWinner ? '1' : undefined as string | undefined,
        status: isWinner ? 'Accepted' : 'Submitted',
      };

      tender.bids!.push(bidEntry);
      tender.bidsCount = tender.bids!.length;

      if (isWinner && !tender.awardDetails) {
        tender.awardDetails = {
          awardeeVendorName: row.vendor_name?.trim() || 'Unknown Vendor',
          awardedAmount: bidAmount,
          awardDate: submissionDate,
        };
      }
    }

    return Array.from(tenderMap.values());
  }

  async searchTenders(filters: TenderSearchFilters): Promise<TenderSearchResult[]> {
    const dataset = await this.loadAndParseCSV();
    let results = dataset;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (t) =>
          t.tenderTitle.toLowerCase().includes(q) ||
          t.tenderId.toLowerCase().includes(q) ||
          t.district.toLowerCase().includes(q) ||
          t.tenderReferenceNumber.toLowerCase().includes(q)
      );
    }
    if (filters.tenderId) {
      results = results.filter((t) => t.tenderId.toLowerCase() === filters.tenderId?.toLowerCase());
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
      publishedDate: t.publishedDate,
      closingDate: t.bidSubmissionClosingDate,
      sourceName: this.sourceName,
      sourceUrl: t.sourceUrl,
      bidsCount: t.bids?.length || t.bidsCount || 0,
      hasAwardData: !!t.awardDetails,
    }));
  }

  async getTenderDetails(tenderId: string): Promise<RawTenderRecord | null> {
    const dataset = await this.loadAndParseCSV();
    return dataset.find((t) => t.tenderId === tenderId) || null;
  }

  async fetchAllAvailable(limit = 100): Promise<RawTenderRecord[]> {
    const dataset = await this.loadAndParseCSV();
    return dataset.slice(0, limit);
  }

  async importDataset(rawContent: string, format: 'json' | 'csv'): Promise<RawTenderRecord[]> {
    if (format === 'csv') {
      const rows = parse(rawContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as ProcurementCsvRow[];
      // Invalidate cache so new data is used
      this.cached = null;
      const records = this.normalizeCsvToTenderRecords(rows);
      this.cached = records;
      return records;
    }
    if (format === 'json') {
      const parsed = JSON.parse(rawContent) as RawTenderRecord | RawTenderRecord[];
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    throw new Error(`Unsupported format: ${format}`);
  }
}
