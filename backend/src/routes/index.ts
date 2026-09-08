import { Router } from 'express';
import { projectRoutes } from './project.routes';
import { importRoutes } from './import.routes';
import { blockchainRoutes } from './blockchain.routes';
import { verifyRoutes } from './verify.routes';
import { dashboardRoutes } from './dashboard.routes';
import { actionsRoutes } from './actions.routes';
import { integrityReportRoutes } from './integrity-report.routes';
import { authRoutes } from './auth.routes';
import { tamperLogRoutes } from './tamper-log.routes';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { documentRoutes } from './document.routes';
export const apiRoutes = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
apiRoutes.use('/auth', authRoutes);

// ─── All routes below require authentication ──────────────────────────────────
apiRoutes.use(authenticate);


// CITIZEN + OFFICIAL + ADMIN: read-only access to projects, blockchain, verify, dashboard, and logs
apiRoutes.use('/projects', requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'), projectRoutes);
apiRoutes.use('/blockchain', requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'), blockchainRoutes);
apiRoutes.use('/verify', requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'), verifyRoutes);
apiRoutes.use(
  '/documents',
  requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'),
  documentRoutes,
);
apiRoutes.use('/dashboard', requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'), dashboardRoutes);
apiRoutes.use('/tamper-logs', requireRole('CITIZEN', 'OFFICIAL', 'ADMIN'), tamperLogRoutes);

// OFFICIAL + ADMIN: authorized operational actions
apiRoutes.use('/actions', requireRole('OFFICIAL', 'ADMIN'), actionsRoutes);

// ADMIN only: import and integrity reports
apiRoutes.use('/import', requireRole('ADMIN'), importRoutes);
apiRoutes.use('/integrity-report', requireRole('ADMIN', 'OFFICIAL'), integrityReportRoutes);

