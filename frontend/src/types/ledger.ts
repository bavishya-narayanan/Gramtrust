export type ProjectStatus = 'Pending' | 'In Progress' | 'Completed' | 'Under Review';
export type BlockchainStatus = 'Pending' | 'Recorded' | 'Verified' | 'Tampered';
export type IntegrityStatus = 'Verified' | 'Mismatch' | 'Review Required';
export type TransactionType = 'Genesis' | 'Import' | 'Store' | 'Verification' | 'Tamper Simulation';

export interface LedgerProject {
  id: string;
  code?: string;
  name: string;
  district: string;
  state: string;
  financialYear: string;
  amount: number;
  blockchainAmount: number;
  status: ProjectStatus;
  blockchainStatus: BlockchainStatus;
  integrityStatus: IntegrityStatus;
  blockchainHash: string;
  remarks: string;
  lastUpdatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  projectId: string;
  projectName: string;
  type: TransactionType;
  description: string;
  hash: string;
  amount: number;
  timestamp: string;
}

export interface DashboardSummary {
  totalProjects: number;
  totalExpenditure: number;
  verifiedProjects: number;
  integrityStatus: IntegrityStatus;
  recentTransactions: LedgerTransaction[];
}

export interface IntegrityReport {
  databaseAmount: number;
  blockchainAmount: number;
  difference: number;
  status: IntegrityStatus;
  mismatchedProjects: LedgerProject[];
}

export interface LedgerState {
  projects: LedgerProject[];
  transactions: LedgerTransaction[];
  lastSyncAt: string;
}

export interface ProjectActionResponse<T = unknown> {
  message: string;
  data: T;
}
