import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from '@/config/env';
import { apiRoutes } from '@/routes';
import { notFoundMiddleware } from '@/middlewares/not-found.middleware';
import { errorMiddleware } from '@/middlewares/error.middleware';

import { projectRepository } from '@/repositories/project.repository';
import { blockchainRepository } from '@/repositories/blockchain.repository';
import { auditRepository } from '@/repositories/audit.repository';
import { tamperLogService } from '@/services/tamper-log.service';
import { documentService } from '@/services/document.service';

let sseClients: express.Response[] = [];

// ============================================================
// PERIODIC BACKGROUND INTEGRITY CHECK
// ============================================================

setInterval(async () => {
  try {
    const projects = await projectRepository.findAll();
    const activeTampered: any[] = [];

    for (const project of projects) {
      const latestRecord =
        await blockchainRepository.findLatestByProjectId(project.id);

      const blockchainAmount = latestRecord
        ? Number(latestRecord.amount)
        : 0;

      const dbAmount = Number(project.amount);

      // --------------------------------------------------------
      // DATABASE AMOUNT DOES NOT MATCH BLOCKCHAIN
      // --------------------------------------------------------

      if (dbAmount !== blockchainAmount) {
        activeTampered.push({
          code: project.code,
          name: project.name,
          dbAmount,
          blockchainAmount,
        });

        // If not already marked as mismatch, record it
        if (project.integrityStatus !== 'Mismatch') {
          await projectRepository.updateBlockchainFields(project.code, {
            integrityStatus: 'Mismatch',
          });

          await auditRepository.create({
            projectId: project.id,
            databaseAmount: dbAmount,
            blockchainAmount,
            difference: dbAmount - blockchainAmount,
            status: 'Mismatch',
            notes: {
              action: 'AUTO_MONITOR_TAMPER',
              timestamp: new Date().toLocaleTimeString(),
            },
          });

          await tamperLogService.logDirectDbChange(
            project.code,
            'amount',
            dbAmount,
            blockchainAmount,
          );
        }
      }

      // --------------------------------------------------------
      // DATABASE MATCHES BLOCKCHAIN
      // --------------------------------------------------------

      else {
        // If previously marked as mismatch but now restored
        if (project.integrityStatus === 'Mismatch') {
          await projectRepository.updateBlockchainFields(project.code, {
            integrityStatus: 'Verified',
          });

          await auditRepository.create({
            projectId: project.id,
            databaseAmount: dbAmount,
            blockchainAmount,
            difference: 0,
            status: 'Verified',
            notes: {
              action: 'AUTO_MONITOR_RESTORE',
              timestamp: new Date().toLocaleTimeString(),
            },
          });
        }
      }
    }

    const tamperedDocuments = await documentService.monitorIntegrity();
    activeTampered.push(
      ...tamperedDocuments.map((document) => ({
        code: document.code,
        name: document.name,
        dbAmount: 0,
        blockchainAmount: 0,
        kind: 'DOCUMENT' as const,
        dbHash: document.dbHash,
        blockchainHash: document.blockchainHash,
      })),
    );

    // ----------------------------------------------------------
    // FETCH RECENT AUDITS FOR HISTORY
    // ----------------------------------------------------------

    const recentAudits = await auditRepository.findRecent(30);

    const historyList = recentAudits
      .filter(
        (audit) =>
          audit.status === 'Mismatch' ||
          (audit.notes &&
            (audit.notes.action === 'AUTO_MONITOR_TAMPER' ||
              audit.notes.action === 'AUTO_MONITOR_RESTORE')),
      )
      .map((audit) => {
        const proj = projects.find((p) => p.id === audit.projectId);

        return {
          code: proj ? proj.code : 'UNKNOWN',
          name: proj ? proj.name : 'Unknown Project',
          dbAmount: audit.databaseAmount,
          blockchainAmount: audit.blockchainAmount,
          timestamp: audit.createdAt.toLocaleTimeString(),
          status:
            audit.status === 'Mismatch'
              ? ('ACTIVE' as const)
              : ('RESTORED' as const),
        };
      });

    // ----------------------------------------------------------
    // SEND DATA TO CONNECTED SSE CLIENTS
    // ----------------------------------------------------------

    const data = JSON.stringify({
      tampered: activeTampered,
      history: historyList,
    });

    sseClients.forEach((client) => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch {
        // Ignore disconnected clients
      }
    });
  } catch (err) {
    console.error('Integrity background check error:', err);
  }
}, 3000);

// ============================================================
// CREATE EXPRESS APP
// ============================================================

export function createApp() {
  const app = express();

  // ==========================================================
  // SECURITY / MIDDLEWARE
  // ==========================================================

  app.use(helmet());

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );

  app.use(express.json({ limit: '2mb' }));

  app.use(express.urlencoded({ extended: true }));

  app.use(
    morgan(
      env.NODE_ENV === 'production'
        ? 'combined'
        : 'dev',
    ),
  );

  // ==========================================================
  // SERVE DOWNLOADED GOVERNMENT DOCUMENTS
  // ==========================================================

  app.use(
    '/documents/files',
    express.static(
      path.resolve(
        process.cwd(),
        'documents',
      ),
    ),
  );

  // Example:
  // http://localhost:4000/documents/files/DOC001.pdf

  // ==========================================================
  // HEALTH CHECK
  // ==========================================================

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'gramtrust-backend',
    });
  });

  // ==========================================================
  // SSE INTEGRITY STREAM
  // ==========================================================

  app.get('/api/integrity-stream', (req, res) => {
    res.setHeader(
      'Content-Type',
      'text/event-stream',
    );

    res.setHeader(
      'Cache-Control',
      'no-cache',
    );

    res.setHeader(
      'Connection',
      'keep-alive',
    );

    res.flushHeaders();

    // Add client
    sseClients.push(res);

    // --------------------------------------------------------
    // SEND INITIAL STATUS FROM DATABASE
    // --------------------------------------------------------

    Promise.all([
      projectRepository.findAll(),
      auditRepository.findRecent(30),
    ])
      .then(async ([projects, recentAudits]) => {
        // ----------------------------------------------------
        // Find currently tampered projects
        // ----------------------------------------------------

        const tamperedProjects = projects.filter(
          (project) =>
            project.integrityStatus === 'Mismatch',
        );

        const activeTampered = await Promise.all(
          tamperedProjects.map(async (project) => {
            const latestRecord =
              await blockchainRepository.findLatestByProjectId(
                project.id,
              );

            const blockchainAmount = latestRecord
              ? Number(latestRecord.amount)
              : 0;

            return {
              code: project.code,
              name: project.name,
              dbAmount: Number(project.amount),
              blockchainAmount,
            };
          }),
        );

        const tamperedDocuments = await documentService.monitorIntegrity();
        activeTampered.push(
          ...tamperedDocuments.map((document) => ({
            code: document.code,
            name: document.name,
            dbAmount: 0,
            blockchainAmount: 0,
            kind: 'DOCUMENT' as const,
            dbHash: document.dbHash,
            blockchainHash: document.blockchainHash,
          })),
        );

        // ----------------------------------------------------
        // Build history
        // ----------------------------------------------------

        const historyList = recentAudits
          .filter(
            (audit) =>
              audit.status === 'Mismatch' ||
              (audit.notes &&
                (audit.notes.action ===
                  'AUTO_MONITOR_TAMPER' ||
                  audit.notes.action ===
                    'AUTO_MONITOR_RESTORE')),
          )
          .map((audit) => {
            const proj = projects.find(
              (p) => p.id === audit.projectId,
            );

            return {
              code: proj
                ? proj.code
                : 'UNKNOWN',

              name: proj
                ? proj.name
                : 'Unknown Project',

              dbAmount: audit.databaseAmount,

              blockchainAmount:
                audit.blockchainAmount,

              timestamp:
                audit.createdAt.toLocaleTimeString(),

              status:
                audit.status === 'Mismatch'
                  ? ('ACTIVE' as const)
                  : ('RESTORED' as const),
            };
          });

        // ----------------------------------------------------
        // Send initial SSE data
        // ----------------------------------------------------

        res.write(
          `data: ${JSON.stringify({
            tampered: activeTampered,
            history: historyList,
          })}\n\n`,
        );
      })
      .catch((err) => {
        console.error(
          'SSE initial status error:',
          err,
        );
      });

    // --------------------------------------------------------
    // CLIENT DISCONNECTED
    // --------------------------------------------------------

    req.on('close', () => {
      sseClients = sseClients.filter(
        (client) => client !== res,
      );
    });
  });

  // ==========================================================
  // API ROUTES
  // ==========================================================

  app.use('/api', apiRoutes);

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  app.use(notFoundMiddleware);

  app.use(errorMiddleware);

  return app;
}