import { randomUUID } from 'node:crypto';
import { pool } from '@/config/db';

export type ChangeType =
  | 'UPDATE'
  | 'UNAUTHORIZED_UPDATE'
  | 'DIRECT_DATABASE_CHANGE'
  | 'BLOCKCHAIN_MISMATCH';

export type TamperStatus = 'AUTHORIZED' | 'BLOCKED' | 'DETECTED';

export interface TamperLogEntry {
  id: string;
  recordId: string;
  userId: string | null;
  userName: string;
  userRole: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: ChangeType;
  status: TamperStatus;
  timestamp: Date;
}

export interface TamperLogFilters {
  userId?: string;
  userRole?: string;
  changeType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  recordId?: string;
  limit?: number;
}

function toEntry(row: Record<string, unknown>): TamperLogEntry {
  return {
    id: row['id'] as string,
    recordId: row['record_id'] as string,
    userId: (row['user_id'] as string | null) ?? null,
    userName: row['user_name'] as string,
    userRole: row['user_role'] as string,
    fieldName: row['field_name'] as string,
    oldValue: (row['old_value'] as string | null) ?? null,
    newValue: (row['new_value'] as string | null) ?? null,
    changeType: row['change_type'] as ChangeType,
    status: row['status'] as TamperStatus,
    timestamp: row['timestamp'] as Date,
  };
}

export const tamperLogRepository = {
  async create(data: Omit<TamperLogEntry, 'id' | 'timestamp'>): Promise<TamperLogEntry> {
    const { rows } = await pool.query(
      `INSERT INTO tamper_logs
        (id, record_id, user_id, user_name, user_role, field_name, old_value, new_value, change_type, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        randomUUID(),
        data.recordId,
        data.userId ?? null,
        data.userName,
        data.userRole,
        data.fieldName,
        data.oldValue ?? null,
        data.newValue ?? null,
        data.changeType,
        data.status,
      ],
    );
    return toEntry(rows[0]!);
  },

  async findAll(filters: TamperLogFilters = {}): Promise<TamperLogEntry[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filters.userId)     { conditions.push(`user_id = $${i++}`);      values.push(filters.userId); }
    if (filters.userRole)   { conditions.push(`user_role = $${i++}`);    values.push(filters.userRole); }
    if (filters.changeType) { conditions.push(`change_type = $${i++}`);  values.push(filters.changeType); }
    if (filters.status)     { conditions.push(`status = $${i++}`);       values.push(filters.status); }
    if (filters.recordId)   { conditions.push(`record_id = $${i++}`);    values.push(filters.recordId); }
    if (filters.dateFrom)   { conditions.push(`timestamp >= $${i++}`);   values.push(filters.dateFrom); }
    if (filters.dateTo)     { conditions.push(`timestamp <= $${i++}`);   values.push(filters.dateTo); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 500;

    const { rows } = await pool.query(
      `SELECT * FROM tamper_logs ${where} ORDER BY timestamp DESC LIMIT $${i}`,
      [...values, limit],
    );
    return rows.map(toEntry);
  },

  async count(): Promise<number> {
    const { rows } = await pool.query(`SELECT COUNT(*) as cnt FROM tamper_logs`);
    return Number(rows[0]?.['cnt'] ?? 0);
  },
};
