export type ProjectStatus = 'Pending' | 'In Progress' | 'Completed' | 'Under Review';
export type BlockchainStatus = 'Pending' | 'Recorded' | 'Verified' | 'Tampered';
export type IntegrityStatus = 'Verified' | 'Mismatch' | 'Review Required';

export interface ProjectInput {
  code: string;
  name: string;
  district: string;
  state: string;
  financialYear: string;
  amount: number;
  status: ProjectStatus;
}

export interface ProjectRecord extends ProjectInput {
  id: string;
  blockchainStatus: BlockchainStatus;
  blockchainHash: string | null;
  integrityStatus: IntegrityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockchainRecordInput {
  projectId: string;
  action: string;
  amount: number;
  payload: Record<string, unknown>;
}

export interface BlockchainRecordDto extends BlockchainRecordInput {
  id: string;
  txHash: string;
  createdAt: Date;
}

export interface IntegrityAuditDto {
  id: string;
  projectId: string | null;
  databaseAmount: number;
  blockchainAmount: number;
  difference: number;
  status: IntegrityStatus;
  notes: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ApiListResponse<T> {
  data: T[];
  count: number;
}
