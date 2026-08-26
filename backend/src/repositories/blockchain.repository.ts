import { randomUUID } from 'node:crypto';
import { pool } from '@/config/db.js';
import type { BlockchainRecordDto, BlockchainRecordInput } from '@/types/ledger.js';

function toDto(row: Record<string, unknown>): BlockchainRecordDto {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    txHash: row['tx_hash'] as string,
    action: row['action'] as string,
    amount: Number(row['amount']),
    payload: row['payload'] as Record<string, unknown>,
    createdAt: row['created_at'] as Date,
  };
}

export const blockchainRepository = {
  async create(record: BlockchainRecordInput & { txHash: string }): Promise<BlockchainRecordDto> {
    const { rows } = await pool.query(
      `INSERT INTO blockchain_records (id, project_id, tx_hash, action, amount, payload)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [randomUUID(), record.projectId, record.txHash, record.action,
       record.amount, JSON.stringify(record.payload)]
    );
    return toDto(rows[0]!);
  },

  async createMany(records: Array<BlockchainRecordInput & { txHash: string }>): Promise<BlockchainRecordDto[]> {
    const results: BlockchainRecordDto[] = [];
    for (const record of records) {
      const dto = await this.create(record);
      results.push(dto);
    }
    return results;
  },

  async findHistoryByProjectId(projectId: string): Promise<BlockchainRecordDto[]> {
    const { rows } = await pool.query(
      `SELECT * FROM blockchain_records WHERE project_id=$1 ORDER BY created_at DESC`,
      [projectId]
    );
    return rows.map(toDto);
  },

  async findRecent(limit = 10): Promise<BlockchainRecordDto[]> {
    const { rows } = await pool.query(
      `SELECT * FROM blockchain_records ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map(toDto);
  },

  async findLatestByProjectId(projectId: string): Promise<BlockchainRecordDto | null> {
    const { rows } = await pool.query(
      `SELECT * FROM blockchain_records WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );
    return rows[0] ? toDto(rows[0]) : null;
  },
};