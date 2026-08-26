import type {
  DashboardSummary,
  IntegrityReport,
  LedgerProject,
  LedgerState,
  LedgerTransaction,
  ProjectActionResponse,
} from '@/types/ledger';

const STORAGE_KEY = 'gramtrust-ledger-state';

const now = () => new Date().toISOString();

const seedProjects: LedgerProject[] = [
  {
    id: 'GT-001',
    name: 'Rural Water Supply Upgrade',
    district: 'Pune',
    state: 'Maharashtra',
    financialYear: '2025-26',
    amount: 8500000,
    blockchainAmount: 8500000,
    status: 'Completed',
    blockchainStatus: 'Verified',
    integrityStatus: 'Verified',
    blockchainHash: '',
    remarks: 'Community water storage and pipeline modernization.',
    lastUpdatedAt: now(),
  },
  {
    id: 'GT-002',
    name: 'Primary School Renovation',
    district: 'Jaipur',
    state: 'Rajasthan',
    financialYear: '2025-26',
    amount: 4200000,
    blockchainAmount: 4200000,
    status: 'In Progress',
    blockchainStatus: 'Recorded',
    integrityStatus: 'Verified',
    blockchainHash: '',
    remarks: 'Classroom repairs, sanitation block, and digital classroom setup.',
    lastUpdatedAt: now(),
  },
  {
    id: 'GT-003',
    name: 'Village Road Repair',
    district: 'Indore',
    state: 'Madhya Pradesh',
    financialYear: '2024-25',
    amount: 9600000,
    blockchainAmount: 9600000,
    status: 'Completed',
    blockchainStatus: 'Verified',
    integrityStatus: 'Verified',
    blockchainHash: '',
    remarks: '3.8 km bitumen repair with drainage reinforcement.',
    lastUpdatedAt: now(),
  },
  {
    id: 'GT-004',
    name: 'Solar Street Lighting',
    district: 'Bhubaneswar',
    state: 'Odisha',
    financialYear: '2025-26',
    amount: 5300000,
    blockchainAmount: 5300000,
    status: 'Under Review',
    blockchainStatus: 'Pending',
    integrityStatus: 'Review Required',
    blockchainHash: '',
    remarks: 'Cluster-wide street lighting for 12 village lanes.',
    lastUpdatedAt: now(),
  },
  {
    id: 'GT-005',
    name: 'Health Sub-Centre Expansion',
    district: 'Madurai',
    state: 'Tamil Nadu',
    financialYear: '2024-25',
    amount: 7800000,
    blockchainAmount: 7800000,
    status: 'In Progress',
    blockchainStatus: 'Recorded',
    integrityStatus: 'Verified',
    blockchainHash: '',
    remarks: 'Women and child health wing with diagnostics room.',
    lastUpdatedAt: now(),
  },
];

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function createTransaction(
  project: LedgerProject,
  type: LedgerTransaction['type'],
  description: string,
): LedgerTransaction {
  return {
    id: `${type}-${project.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    projectId: project.id,
    projectName: project.name,
    type,
    description,
    hash: hashText(`${project.id}|${project.amount}|${project.blockchainAmount}|${type}|${Date.now()}`),
    amount: project.amount,
    timestamp: now(),
  };
}

function withHashes(projects: LedgerProject[]) {
  return projects.map((project) => ({
    ...project,
    blockchainHash: hashText(`${project.id}|${project.blockchainAmount}|${project.status}`),
  }));
}

function createInitialState(): LedgerState {
  const projects = withHashes(seedProjects);
  const transactions = projects.map((project, index) => ({
    id: `Genesis-${project.id}-${index}`,
    projectId: project.id,
    projectName: project.name,
    type: 'Genesis' as const,
    description: `Initial immutable ledger entry created for ${project.name}.`,
    hash: hashText(`${project.id}|genesis|${project.amount}`),
    amount: project.amount,
    timestamp: now(),
  }));

  return {
    projects,
    transactions,
    lastSyncAt: now(),
  };
}

function readState(): LedgerState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initialState = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    return JSON.parse(raw) as LedgerState;
  } catch {
    const initialState = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }
}

function writeState(state: LedgerState) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function updateProjectIntegrity(project: LedgerProject): LedgerProject {
  const integrityStatus = project.amount === project.blockchainAmount ? 'Verified' : 'Mismatch';
  const blockchainStatus =
    project.amount === project.blockchainAmount
      ? project.blockchainStatus === 'Pending'
        ? 'Recorded'
        : 'Verified'
      : 'Tampered';

  return {
    ...project,
    integrityStatus: integrityStatus === 'Verified' ? 'Verified' : 'Review Required',
    blockchainStatus,
    blockchainHash: hashText(`${project.id}|${project.blockchainAmount}|${project.status}`),
  };
}

function mutateState(mutator: (state: LedgerState) => LedgerState): LedgerState {
  const nextState = mutator(readState());
  const resolvedState = {
    ...nextState,
    projects: nextState.projects.map(updateProjectIntegrity),
    lastSyncAt: now(),
  };
  writeState(resolvedState);
  return resolvedState;
}

function findProjectOrThrow(state: LedgerState, projectId: string) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }
  return project;
}

export const ledgerApi = {
  getState(): LedgerState {
    return readState();
  },

  reset(): ProjectActionResponse<LedgerState> {
    const state = createInitialState();
    writeState(state);
    return {
      message: 'Dataset reset to the verified baseline.',
      data: state,
    };
  },

  getDashboard(): DashboardSummary {
    const state = readState();
    const totalProjects = state.projects.length;
    const totalExpenditure = state.projects.reduce((sum, project) => sum + project.amount, 0);
    const verifiedProjects = state.projects.filter((project) => project.integrityStatus === 'Verified').length;
    const integrityStatus = verifiedProjects === totalProjects ? 'Verified' : 'Review Required';

    return {
      totalProjects,
      totalExpenditure,
      verifiedProjects,
      integrityStatus,
      recentTransactions: state.transactions.slice(0, 5),
    };
  },

  getProjects(): LedgerProject[] {
    return readState().projects;
  },

  getProject(projectId: string): LedgerProject {
    return findProjectOrThrow(readState(), projectId);
  },

  getTransactions(projectId?: string): LedgerTransaction[] {
    const state = readState();
    return projectId ? state.transactions.filter((transaction) => transaction.projectId === projectId) : state.transactions;
  },

  getIntegrityReport(): IntegrityReport {
    const projects = readState().projects;
    const databaseAmount = projects.reduce((sum, project) => sum + project.amount, 0);
    const blockchainAmount = projects.reduce((sum, project) => sum + project.blockchainAmount, 0);
    return {
      databaseAmount,
      blockchainAmount,
      difference: databaseAmount - blockchainAmount,
      status: databaseAmount === blockchainAmount ? 'Verified' : 'Review Required',
      mismatchedProjects: projects.filter((project) => project.amount !== project.blockchainAmount),
    };
  },

  importDataset(): ProjectActionResponse<LedgerState> {
    const state = mutateState((current) => {
      const imported = createInitialState();
      return {
        ...imported,
        transactions: [
          createTransaction(imported.projects[0], 'Import', 'Fresh dataset imported from district treasury archive.'),
          ...current.transactions,
        ],
      };
    });

    return {
      message: 'Dataset imported successfully.',
      data: state,
    };
  },

  storeRecordsOnBlockchain(): ProjectActionResponse<LedgerState> {
    const state = mutateState((current) => {
      const projects = current.projects.map((project) => ({
        ...project,
        blockchainAmount: project.amount,
        blockchainStatus: 'Recorded' as const,
        integrityStatus: 'Verified' as const,
      }));

      const transactionSeed = projects.slice(0, 3).map((project) =>
        createTransaction(project, 'Store', 'Project records stored to the immutable blockchain ledger.'),
      );

      return {
        ...current,
        projects,
        transactions: [...transactionSeed, ...current.transactions],
      };
    });

    return {
      message: 'Project records stored on blockchain.',
      data: state,
    };
  },

  simulateTampering(): ProjectActionResponse<LedgerState> {
    const state = mutateState((current) => {
      const tamperedProjectId = current.projects.find((project) => project.blockchainStatus !== 'Tampered')?.id ?? current.projects[0].id;

      const projects = current.projects.map((project) => {
        if (project.id !== tamperedProjectId) {
          return project;
        }

        return {
          ...project,
          amount: project.amount + 175000,
          status: 'Under Review' as const,
          integrityStatus: 'Review Required' as const,
          blockchainStatus: 'Tampered' as const,
          lastUpdatedAt: now(),
        };
      });

      const tamperedProject = projects.find((project) => project.id === tamperedProjectId)!;

      return {
        ...current,
        projects,
        transactions: [
          createTransaction(tamperedProject, 'Tamper Simulation', 'Unauthorized amount change detected in database record.'),
          ...current.transactions,
        ],
      };
    });

    return {
      message: 'Tampering scenario simulated.',
      data: state,
    };
  },

  verifyBlockchain(): ProjectActionResponse<LedgerState> {
    const state = mutateState((current) => {
      const projects = current.projects.map((project) => updateProjectIntegrity(project));
      return {
        ...current,
        projects,
        transactions: [
          createTransaction(projects[0], 'Verification', 'Global blockchain verification run completed.'),
          ...current.transactions,
        ],
      };
    });

    return {
      message: 'Blockchain verification completed.',
      data: state,
    };
  },

  verifyProject(projectId: string): ProjectActionResponse<LedgerProject> {
    const state = mutateState((current) => {
      const projects = current.projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        return updateProjectIntegrity(project);
      });

      const project = projects.find((item) => item.id === projectId)!;

      return {
        ...current,
        projects,
        transactions: [
          createTransaction(project, 'Verification', `Integrity verification run for ${project.name}.`),
          ...current.transactions,
        ],
      };
    });

    return {
      message: `Integrity verified for ${projectId}.`,
      data: state.projects.find((project) => project.id === projectId)!,
    };
  },
};