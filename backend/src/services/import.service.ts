import { readFile } from 'node:fs/promises';
import { AppError } from '@/utils/app-error';
import { parseNregaCsv } from '@/utils/csv';
import { createLedgerHash } from '@/utils/ledger-hash';
import { blockchainRepository } from '@/repositories/blockchain.repository';
import { projectRepository } from '@/repositories/project.repository';
import { fabricGateway } from '@/services/fabric.gateway';
import type { ProjectInput } from '@/types/ledger';

function toProjectInput(row: ReturnType<typeof parseNregaCsv>[number], index: number): ProjectInput {
  const totalExpenditureLakhs = Number(
    row['Total Exp(Rs. in Lakhs.)'] ?? row['Wages(Rs. In Lakhs)'] ?? 0,
  );
  const code = `${row.state_name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')}-${row.district_name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')}-${String(index + 1).padStart(4, '0')}`;

  return {
    code,
    name: `NREGA Works - ${row.district_name.trim()}`,
    district: row.district_name.trim(),
    state: row.state_name.trim(),
    financialYear: 'NREGA 2024-25',
    amount: Math.round(totalExpenditureLakhs * 100000),
    status: Number(row['Total No. of Active Workers'] ?? 0) > 0 ? 'In Progress' : 'Under Review',
  };
}

export const importService = {
  async importFromCsv(csvContent: string) {
    const rows = parseNregaCsv(csvContent);
    if (!rows.length) {
      throw new AppError('CSV file is empty', 400);
    }

    const inputs = rows.map((row, index) => toProjectInput(row, index));
    const projects = await projectRepository.upsertMany(inputs);

    // Build blockchain records with a timestamp+nonce so re-imports don't collide
    const timestamp = Date.now();
    const records = projects.map((project, index) => ({
      projectId: project.id,
      action: 'IMPORT',
      amount: project.amount,
      payload: { code: project.code, source: 'csv' },
      txHash: createLedgerHash(`${project.code}|IMPORT|${project.amount}|${timestamp}|${index}`),
    }));

    // Insert blockchain records — skip if already exists (ON CONFLICT DO NOTHING via try/catch)
    for (const rec of records) {
      try {
        await blockchainRepository.create(rec);
        if (fabricGateway.enabled) {
          await fabricGateway.store({
            projectCode: rec.payload.code as string,
            action: 'IMPORT',
            amount: Number(rec.amount),
            hash: rec.txHash,
            timestamp: new Date(timestamp).toISOString(),
          });
        }
      } catch (e: unknown) {
        // Ignore unique constraint violations on tx_hash (duplicate import)
        if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
          continue;
        }
        throw e;
      }
    }

    return projects;
  },

  async importFromFile(filePath: string) {
    const csvContent = await readFile(filePath, 'utf8');
    return this.importFromCsv(csvContent);
  },
};
