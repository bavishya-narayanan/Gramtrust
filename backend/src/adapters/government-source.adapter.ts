export interface RawTenderRecord {
  tenderId: string;
  tenderReferenceNumber: string;
  tenderTitle: string;
  department: string;
  organisationChain?: string | undefined;
  tenderType?: string | undefined;
  tenderCategory?: string | undefined;
  formOfContract?: string | undefined;
  productCategory?: string | undefined;
  location?: string | undefined;
  pincode?: string | undefined;
  state: string;
  district: string;
  panchayat?: string | undefined;
  estimatedValue: number;
  currency?: string | undefined;
  publishedDate?: string | undefined;
  bidSubmissionStartDate?: string | undefined;
  bidSubmissionClosingDate?: string | undefined;
  bidOpeningDate?: string | undefined;
  status: string;
  sourceUrl: string;
  sourceName: string;
  sourceDatasetId?: string | undefined;
  invitingAuthority?: string | undefined;
  periodOfWorkDays?: number | undefined;
  bidsCount?: number | undefined;
  bids?: Array<{
    bidId: string;
    vendorName: string;
    vendorGstin?: string | undefined;
    vendorState?: string | undefined;
    bidAmount: number;
    submissionDate?: string | undefined;
    technicalScore?: number | undefined;
    financialRank?: string | undefined;
    status: string;
  }> | undefined;
  awardDetails?: {
    awardeeVendorName: string;
    awardeeGstin?: string | undefined;
    awardedAmount: number;
    awardDate: string;
    contractNumber?: string | undefined;
    completionDeadline?: string | undefined;
  } | null | undefined;
}

export interface TenderSearchFilters {
  query?: string | undefined;
  tenderId?: string | undefined;
  referenceNumber?: string | undefined;
  department?: string | undefined;
  state?: string | undefined;
  district?: string | undefined;
  status?: string | undefined;
  minEstimatedValue?: number | undefined;
  maxEstimatedValue?: number | undefined;
  source?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface TenderSearchResult {
  tenderId: string;
  tenderReferenceNumber: string;
  tenderTitle: string;
  department: string;
  state: string;
  district: string;
  estimatedValue: number;
  currency: string;
  status: string;
  publishedDate?: string | undefined;
  closingDate?: string | undefined;
  sourceName: string;
  sourceUrl: string;
  bidsCount: number;
  hasAwardData: boolean;
}

export interface GovernmentSourceAdapter {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly baseUrl: string;
  readonly isLiveApiAvailable: boolean;

  searchTenders(filters: TenderSearchFilters): Promise<TenderSearchResult[]>;
  getTenderDetails(tenderId: string): Promise<RawTenderRecord | null>;
  fetchAllAvailable(limit?: number): Promise<RawTenderRecord[]>;
  importDataset(rawContent: string, format: 'json' | 'csv'): Promise<RawTenderRecord[]>;
}
