import { AppError } from '@/utils/app-error';
import { createLedgerHash } from '@/utils/ledger-hash';
import { auditRepository } from '@/repositories/audit.repository';
import { blockchainRepository } from '@/repositories/blockchain.repository';
import { projectRepository } from '@/repositories/project.repository';
import { pool } from '@/config/db';
import { fabricGateway } from '@/services/fabric.gateway';

export const blockchainService = {
  async storeAll() {
    const projects = await projectRepository.findAll();
    const timestamp = Date.now();
    const records = projects.map((project, index) => ({
      projectId: project.id,
      action: 'STORE',
      amount: project.amount,
      payload: { code: project.code, status: project.status } as Record<string, unknown>,
      txHash: createLedgerHash(`${project.code}|STORE|${project.amount}|${timestamp}|${index}`),
    }));

    for (const record of records) {
      if (fabricGateway.enabled) {
        const fabricResult = await fabricGateway.store({
          projectCode: String(record.payload.code),
          action: record.action,
          amount: record.amount,
          hash: record.txHash,
          timestamp: new Date(timestamp).toISOString(),
        });
        record.payload = { ...record.payload, fabricTxId: fabricResult.txId };
      }
    }

    await blockchainRepository.createMany(records);

    // Mark all projects as blockchain-recorded
    await pool.query(
      `UPDATE projects SET blockchain_status='Recorded', updated_at=NOW() WHERE id = ANY($1::text[])`,
      [projects.map((p) => p.id)],
    );

    return projects;
  },

  async storeByCode(code: string) {
    const project = await projectRepository.findByCode(code);
    if (!project) {
      throw new AppError(`Project ${code} not found`, 404);
    }

    const txHash = createLedgerHash(
      `${project.code}|STORE|${project.amount}|${Date.now()}|${Math.random().toString(16).slice(2, 10)}`,
    );
    let payload: Record<string, unknown> = { code: project.code, status: project.status };
    if (fabricGateway.enabled) {
      const fabricResult = await fabricGateway.store({
        projectCode: project.code,
        action: 'STORE',
        amount: project.amount,
        hash: txHash,
        timestamp: new Date().toISOString(),
      });
      payload = { ...payload, fabricTxId: fabricResult.txId };
    }

    return blockchainRepository.create({
      projectId: project.id,
      action: 'STORE',
      amount: project.amount,
      payload,
      txHash,
    });
  },

  async history(code: string) {
    const project = await projectRepository.findByCode(code);
    if (!project) {
      throw new AppError(`Project ${code} not found`, 404);
    }

    return blockchainRepository.findHistoryByProjectId(project.id);
  },

  async verifyProject(code: string) {
    const project = await projectRepository.findByCode(code);
    if (!project) {
      throw new AppError(`Project ${code} not found`, 404);
    }

    const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
    const blockchainAmount = latestRecord ? latestRecord.amount : 0;
    const difference = project.amount - blockchainAmount;
    const integrityStatus = difference === 0 ? 'Verified' : 'Mismatch';

    await auditRepository.create({
      projectId: project.id,
      databaseAmount: project.amount,
      blockchainAmount,
      difference,
      status: integrityStatus,
      notes: { action: 'BLOCKCHAIN_VERIFY' },
    });

    return {
      ...project,
      blockchainAmount,
      difference,
      integrityStatus,
    };
  },

  async simulateTampering() {
    const all = await projectRepository.findAll();
    const project = all.find((item) => item.blockchainStatus !== 'Tampered') ?? all[0];

    if (!project) {
      throw new AppError('No project available to tamper with', 404);
    }

    const newAmount = project.amount + 175000;
    const newHash = createLedgerHash(
      `${project.code}|TAMPERED|${Date.now()}|${Math.random().toString(16).slice(2, 10)}`,
    );

    await pool.query(
      `UPDATE projects
       SET amount=$1, status='Under Review', blockchain_status='Tampered',
           integrity_status='Review Required', blockchain_hash=$2, updated_at=NOW()
       WHERE code=$3`,
      [newAmount, newHash, project.code],
    );

    const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
    const blockchainAmount = latestRecord ? latestRecord.amount : 0;

    await auditRepository.create({
      projectId: project.id,
      databaseAmount: newAmount,
      blockchainAmount,
      difference: newAmount - blockchainAmount,
      status: 'Review Required',
      notes: { action: 'TAMPER_SIMULATION' },
    });

    return {
      id: project.code,
      name: project.name,
      district: project.district,
      state: project.state,
      financialYear: project.financialYear,
      amount: newAmount,
      blockchainAmount,
      status: 'Under Review',
      blockchainStatus: 'Tampered',
      integrityStatus: 'Review Required',
      blockchainHash: newHash,
      remarks: 'Tampering simulated for audit testing.',
      lastUpdatedAt: new Date().toISOString(),
    };
  },
};
