import { auditRepository } from '@/repositories/audit.repository';
import { blockchainRepository } from '@/repositories/blockchain.repository';
import { projectRepository } from '@/repositories/project.repository';
import { pool } from '@/config/db';
import { AppError } from '@/utils/app-error';
import { toClientProject } from '@/services/project.service';
import type { IntegrityStatus } from '@/types/ledger';

export const verifyService = {
  async verifyAll() {
    const projects = await projectRepository.findAll();
    let mismatchCount = 0;

    const summary = await Promise.all(
      projects.map(async (project) => {
        const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
        const blockchainAmount = latestRecord ? latestRecord.amount : 0;
        const difference = project.amount - blockchainAmount;
        const status: IntegrityStatus = difference === 0 ? 'Verified' : 'Mismatch';
        if (status === 'Mismatch') mismatchCount++;

        // Persist integrity status back to the projects table
        await pool.query(
          `UPDATE projects SET integrity_status=$1, blockchain_status=$2, updated_at=NOW() WHERE id=$3`,
          [status, latestRecord ? 'Verified' : 'Pending', project.id],
        );

        await auditRepository.create({
          projectId: project.id,
          databaseAmount: project.amount,
          blockchainAmount,
          difference,
          status,
          notes: { action: 'GLOBAL_VERIFY' },
        });

        return { project: toClientProject(project, blockchainAmount), blockchainAmount, difference, status };
      }),
    );

    return summary;
  },

  async report() {
    const projects = await projectRepository.findAll();
    const databaseAmount = projects.reduce((sum, project) => sum + project.amount, 0);

    const blockchainAmounts = await Promise.all(
      projects.map(async (project) => {
        const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
        return {
          project,
          blockchainAmount: latestRecord ? latestRecord.amount : 0,
        };
      }),
    );

    const blockchainAmount = blockchainAmounts.reduce((sum, entry) => sum + entry.blockchainAmount, 0);
    const difference = databaseAmount - blockchainAmount;
    const mismatchedProjects = blockchainAmounts
      .filter((entry) => entry.project.amount !== entry.blockchainAmount)
      .map((entry) => toClientProject(entry.project, entry.blockchainAmount));
    const status: IntegrityStatus = difference === 0 ? 'Verified' : 'Review Required';

    await auditRepository.create({
      projectId: null,
      databaseAmount,
      blockchainAmount,
      difference,
      status,
      notes: { action: 'REPORT' },
    });

    return {
      databaseAmount,
      blockchainAmount,
      difference,
      status,
      mismatchedProjects,
    };
  },

  async recentTransactions() {
    return blockchainRepository.findRecent(10);
  },

  async verifyProject(code: string) {
    const project = await projectRepository.findByCode(code);
    if (!project) {
      throw new AppError(`Project ${code} not found`, 404);
    }

    const latestRecord = await blockchainRepository.findLatestByProjectId(project.id);
    const blockchainAmount = latestRecord ? latestRecord.amount : 0;
    const difference = project.amount - blockchainAmount;
    const status: IntegrityStatus = difference === 0 ? 'Verified' : 'Mismatch';

    await auditRepository.create({
      projectId: project.id,
      databaseAmount: project.amount,
      blockchainAmount,
      difference,
      status,
      notes: { action: 'VERIFY_PROJECT' },
    });

    return {
      project: toClientProject(project, blockchainAmount),
      blockchainAmount,
      difference,
      status,
    };
  },
};
