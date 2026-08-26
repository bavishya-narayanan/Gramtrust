import { randomUUID } from 'node:crypto';
import { pool } from '@/config/db.js';
import type { ProjectInput, ProjectRecord } from '@/types/ledger.js';

function toRecord(row: Record<string, unknown>): ProjectRecord {
  return {
    id: row['id'] as string,
    code: row['code'] as string,
    name: row['name'] as string,
    district: row['district'] as string,
    state: row['state'] as string,
    financialYear: row['financial_year'] as string,
    amount: Number(row['amount']),
    status: row['status'] as ProjectRecord['status'],
    blockchainStatus: row['blockchain_status'] as ProjectRecord['blockchainStatus'],
    blockchainHash: (row['blockchain_hash'] as string | null) ?? null,
    integrityStatus: row['integrity_status'] as ProjectRecord['integrityStatus'],
    createdAt: row['created_at'] as Date,
    updatedAt: row['updated_at'] as Date,
  };
}

export const projectRepository = {
  async findAll(): Promise<ProjectRecord[]> {
    const { rows } = await pool.query(
      `SELECT * FROM projects ORDER BY created_at DESC`
    );
    return rows.map(toRecord);
  },

  async findByCode(code: string): Promise<ProjectRecord | null> {
    const { rows } = await pool.query(
      `SELECT * FROM projects WHERE code = $1 LIMIT 1`,
      [code]
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async findByIdOrThrow(code: string): Promise<ProjectRecord> {
    const project = await this.findByCode(code);
    if (!project) throw new Error(`Project ${code} not found`);
    return project;
  },

  async create(input: ProjectInput): Promise<ProjectRecord> {
    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO projects
        (id, code, name, district, state, financial_year, amount, status,
         blockchain_status, blockchain_hash, integrity_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',NULL,'Review Required')
       RETURNING *`,
      [id, input.code, input.name, input.district, input.state,
       input.financialYear, input.amount, input.status]
    );
    return toRecord(rows[0]!);
  },

  async update(code: string, input: Partial<ProjectInput>): Promise<ProjectRecord> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (input.name)          { fields.push(`name=$${i++}`);          values.push(input.name); }
    if (input.district)      { fields.push(`district=$${i++}`);      values.push(input.district); }
    if (input.state)         { fields.push(`state=$${i++}`);         values.push(input.state); }
    if (input.financialYear) { fields.push(`financial_year=$${i++}`);values.push(input.financialYear); }
    if (input.amount !== undefined) { fields.push(`amount=$${i++}`); values.push(input.amount); }
    if (input.status)        { fields.push(`status=$${i++}`);        values.push(input.status); }

    fields.push(`updated_at=NOW()`);
    values.push(code);

    const { rows } = await pool.query(
      `UPDATE projects SET ${fields.join(',')} WHERE code=$${i} RETURNING *`,
      values
    );
    return toRecord(rows[0]!);
  },

  async updateBlockchainFields(code: string, data: {
    blockchainStatus?: string;
    blockchainHash?: string;
    integrityStatus?: string;
  }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (data.blockchainStatus) { fields.push(`blockchain_status=$${i++}`); values.push(data.blockchainStatus); }
    if (data.blockchainHash)   { fields.push(`blockchain_hash=$${i++}`);   values.push(data.blockchainHash); }
    if (data.integrityStatus)  { fields.push(`integrity_status=$${i++}`);  values.push(data.integrityStatus); }
    fields.push(`updated_at=NOW()`);
    values.push(code);

    await pool.query(
      `UPDATE projects SET ${fields.join(',')} WHERE code=$${i}`,
      values
    );
  },

  async delete(code: string): Promise<void> {
    await pool.query(`DELETE FROM projects WHERE code=$1`, [code]);
  },

  async upsertMany(inputs: ProjectInput[]): Promise<ProjectRecord[]> {
    const results: ProjectRecord[] = [];
    for (const input of inputs) {
      const { rows } = await pool.query(
        `INSERT INTO projects
          (id, code, name, district, state, financial_year, amount, status,
           blockchain_status, blockchain_hash, integrity_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending',NULL,'Review Required')
         ON CONFLICT (code) DO UPDATE SET
           name=EXCLUDED.name,
           district=EXCLUDED.district,
           state=EXCLUDED.state,
           financial_year=EXCLUDED.financial_year,
           amount=EXCLUDED.amount,
           status=EXCLUDED.status,
           updated_at=NOW()
         RETURNING *`,
        [randomUUID(), input.code, input.name, input.district, input.state,
         input.financialYear, input.amount, input.status]
      );
      results.push(toRecord(rows[0]!));
    }
    return results;
  },
};