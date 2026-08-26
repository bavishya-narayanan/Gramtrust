import { randomUUID } from 'node:crypto';
import { pool } from '@/config/db';
import type { IntegrityAuditDto, IntegrityStatus } from '@/types/ledger';

function toDto(row: Record<string, unknown>): IntegrityAuditDto {
  return {
    id: row['id'] as string,
    projectId: (row['project_id'] as string | null) ?? null,
    databaseAmount: Number(row['database_amount']),
    blockchainAmount: Number(row['blockchain_amount']),
    difference: Number(row['difference']),
    status: row['status'] as IntegrityStatus,
    notes:
      row['notes'] !== null && typeof row['notes'] === 'object'
        ? (row['notes'] as Record<string, unknown>)
        : null,
    createdAt: row['created_at'] as Date,
  };
}

export const auditRepository = {
  async create(data: {
    projectId?: string | null;
    databaseAmount: number;
    blockchainAmount: number;
    difference: number;
    status: IntegrityStatus;
    notes?: Record<string, unknown> | null;
  }): Promise<IntegrityAuditDto> {
    const { rows } = await pool.query(
      `INSERT INTO integrity_audits
        (id, project_id, database_amount, blockchain_amount, difference, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        randomUUID(),
        data.projectId ?? null,
        data.databaseAmount,
        data.blockchainAmount,
        data.difference,
        data.status,
        data.notes ? JSON.stringify(data.notes) : null,
      ],
    );
    return toDto(rows[0]!);
  },

  async findRecent(limit = 20): Promise<IntegrityAuditDto[]> {
    const { rows } = await pool.query(
      `SELECT * FROM integrity_audits ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toDto);
  },
};
