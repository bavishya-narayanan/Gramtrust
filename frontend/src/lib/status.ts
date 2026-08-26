import type { BadgeVariant } from '@/components/ui/badge';
import type { BlockchainStatus, IntegrityStatus, ProjectStatus, TransactionType } from '@/types/ledger';

export function getProjectBadgeVariant(status: ProjectStatus): BadgeVariant {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'default';
    case 'Under Review':
      return 'warning';
    case 'Pending':
    default:
      return 'secondary';
  }
}

export function getBlockchainBadgeVariant(status: BlockchainStatus): BadgeVariant {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Recorded':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Tampered':
      return 'danger';
    default:
      return 'secondary';
  }
}

export function getIntegrityBadgeVariant(status: IntegrityStatus): BadgeVariant {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Review Required':
      return 'warning';
    case 'Mismatch':
    default:
      return 'danger';
  }
}

export function getTransactionBadgeVariant(type: TransactionType): BadgeVariant {
  switch (type) {
    case 'Genesis':
      return 'secondary';
    case 'Import':
      return 'default';
    case 'Store':
      return 'success';
    case 'Verification':
      return 'outline';
    case 'Tamper Simulation':
      return 'danger';
    default:
      return 'secondary';
  }
}
