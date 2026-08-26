import { blockchainRepository } from '@/repositories/blockchain.repository';
import { projectRepository } from '@/repositories/project.repository';

export const dashboardService = {
  async getSummary() {
    const projects = await projectRepository.findAll();

    // Compute total expenditure from DB
    const totalExpenditure = projects.reduce((sum, p) => sum + p.amount, 0);

    // Get recent blockchain transactions
    const recentRecords = await blockchainRepository.findRecent(5);

    // Determine verified count and overall integrity status
    const verifiedProjects = projects.filter(
      (p) => p.integrityStatus === 'Verified',
    ).length;

    const hasMismatch = projects.some((p) => p.integrityStatus === 'Mismatch');
    const integrityStatus = hasMismatch
      ? 'Mismatch'
      : projects.length === 0
      ? 'Review Required'
      : verifiedProjects === projects.length
      ? 'Verified'
      : 'Review Required';

    // Map recent blockchain records to frontend LedgerTransaction shape
    const recentTransactions = recentRecords.map((rec) => {
      // Find project for this record
      const project = projects.find((p) => p.id === rec.projectId);
      return {
        id: rec.id,
        projectId: rec.projectId,
        projectName: project?.name ?? 'Unknown',
        type: rec.action as string,
        description: `${rec.action} for ${project?.code ?? rec.projectId}`,
        hash: rec.txHash,
        amount: rec.amount,
        timestamp:
          rec.createdAt instanceof Date
            ? rec.createdAt.toISOString()
            : String(rec.createdAt),
      };
    });

    return {
      totalProjects: projects.length,
      totalExpenditure,
      verifiedProjects,
      integrityStatus,
      recentTransactions,
    };
  },
};