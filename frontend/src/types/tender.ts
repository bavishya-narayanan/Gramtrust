export interface SourceSnapshot {
  id: string;
  sourceName: string;
  sourceUrl: string;
  resourceId?: string | null;
  fetchTimestamp: string;
  rawData: any;
  sha256: string;
  recordCount: number;
  status: string;
  metadata?: any;
  importedById?: string | null;
  createdAt: string;
}

export interface TenderVersion {
  id: string;
  tenderId: string;
  versionNumber: number;
  previousVersionId?: string | null;
  sourceSnapshotId?: string | null;
  data: any;
  changedBy: string;
  changedAt: string;
  changeReason: string;
  previousHash?: string | null;
  newHash: string;
  blockchainTxId?: string | null;
  createdAt: string;
  snapshot?: {
    id: string;
    sourceName: string;
    sourceUrl: string;
    sha256: string;
  };
}

export interface BidVersion {
  id: string;
  bidId: string;
  versionNumber: number;
  previousVersionId?: string | null;
  data: any;
  bidAmount: number;
  status: string;
  changedBy: string;
  changeReason: string;
  previousHash?: string | null;
  newHash: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  vendorId?: string | null;
  vendorName: string;
  vendorGstin?: string | null;
  bidAmount: number;
  submissionDate?: string | null;
  technicalScore?: number | null;
  financialRank?: string | null;
  status: string;
  currentVersionNumber: number;
  currentHash: string;
  blockchainTxId?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor | null;
  versions?: BidVersion[];
}

export interface Vendor {
  id: string;
  name: string;
  gstin?: string | null;
  pan?: string | null;
  state?: string | null;
  district?: string | null;
  address?: string | null;
  isBlacklisted: boolean;
  currentVersionNumber: number;
  totalParticipated?: number;
  totalWon?: number;
  winPercentage?: number | null;
  totalAwardedValue?: number | null;
  createdAt: string;
  updatedAt: string;
  bids?: any[];
  versions?: any[];
}

export interface TenderAuditEvent {
  id: string;
  tenderId: string;
  eventType: string;
  actor: string;
  actorRole?: string | null;
  versionNumber?: number | null;
  details: any;
  hash: string;
  blockchainTxId?: string | null;
  createdAt: string;
}

export interface BlockchainTransaction {
  id: string;
  tenderId?: string | null;
  txId: string;
  eventType: string;
  recordId: string;
  version: number;
  hash: string;
  actor: string;
  channel: string;
  chaincode: string;
  status: string;
  payload: any;
  createdAt: string;
}

export interface BidIntegrityStatus {
  bidId: string;
  vendorName: string;
  currentVersion: number;
  trustedHash: string;
  computedHash: string;
  isValid: boolean;
  originalAmount: number;
  currentAmount: number;
  tamperLogId: string | null;
}

export interface Tender {
  id: string;
  tenderId: string;
  referenceNumber: string;
  title: string;
  department: string;
  organisationChain?: string | null;
  tenderType?: string | null;
  tenderCategory?: string | null;
  formOfContract?: string | null;
  productCategory?: string | null;
  state: string;
  district: string;
  panchayat?: string | null;
  location?: string | null;
  pincode?: string | null;
  estimatedValue: number;
  currency: string;
  status: string;
  publishedDate?: string | null;
  closingDate?: string | null;
  openingDate?: string | null;
  invitingAuthority?: string | null;
  periodOfWorkDays?: number | null;
  currentVersionNumber: number;
  currentHash: string;
  blockchainStatus: string;
  blockchainTxId?: string | null;
  blockchainVerified: boolean;

  sourceSnapshotId: string;
  createdAt: string;
  updatedAt: string;
  snapshot?: SourceSnapshot;
  versions?: TenderVersion[];
  bids?: Bid[];
  auditEvents?: TenderAuditEvent[];

  blockchainTransactions?: BlockchainTransaction[];
  _count?: {
    bids: number;
    versions: number;
    auditEvents: number;
  };
}

export interface TenderStats {
  totalTenders: number;
  activeTenders: number;
  awardedTenders: number;
  totalVendors: number;
  totalProcurementValue: number;
  tamperAlerts?: number;

}

export interface IntegrityVerificationReport {
  tenderId: string;
  verified: boolean;
  isTampered?: boolean;
  tamperedVendorName?: string | null;
  tamperMessage?: string | null;
  databaseIntegrity: boolean;
  versionChainValid: boolean;
  blockchainVerified: boolean;
  snapshotIntegrity: boolean;
  totalVersions: number;
  totalBids: number;
  tamperAlerts: BidIntegrityStatus[];
  versionDetails: Array<{
    versionNumber: number;
    expectedHash: string;
    computedHash: string;
    previousHash: string | null;
    isValid: boolean;
    changedBy: string;
    changedAt: string;
    changeReason: string;
    blockchainStatus: 'VERIFIED_ON_CHAIN' | 'UNANCHORED' | 'MISMATCH';
  }>;
  bidDetails: BidIntegrityStatus[];
  snapshotDetails: {
    sourceName: string;
    sourceUrl: string;
    storedSha256: string;
    computedSha256: string;
    isValid: boolean;
  };
  blockchainSummary: {
    enabled: boolean;
    onChainEventsCount: number;
    ledgerHashMatch: boolean;
    message: string;
  };
  verifiedAt: string;
}

export interface GovernmentSourceInfo {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  isLiveApiAvailable: boolean;
}

export interface CatalogTenderItem {
  tenderId: string;
  tenderReferenceNumber: string;
  tenderTitle: string;
  department: string;
  state: string;
  district: string;
  estimatedValue: number;
  currency: string;
  status: string;
  publishedDate?: string;
  closingDate?: string;
  sourceName: string;
  sourceUrl: string;
  bidsCount: number;
  hasAwardData: boolean;
}

export interface TamperLog {
  id: string;
  recordId: string;
  bidId?: string | null;
  tenderId?: string | null;
  vendorName?: string | null;
  vendorId?: string | null;
  userId?: string | null;
  userName: string;
  userRole: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changeType: string;
  status: 'AUTHORIZED' | 'BLOCKED' | 'DETECTED' | 'TAMPERED';
  timestamp: string;
}
