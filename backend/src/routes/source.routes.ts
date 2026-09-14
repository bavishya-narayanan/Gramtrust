import { Router } from 'express';
import { sourceController } from '@/controllers/source.controller.js';
import { requireRole } from '@/middlewares/auth.middleware.js';

export const sourceRoutes = Router();

// Browsing catalog & adapters: CITIZEN, OFFICIAL, AUDITOR, ADMIN
sourceRoutes.get('/adapters', sourceController.getAdapters);
sourceRoutes.get('/catalog', sourceController.searchCatalog);
sourceRoutes.get('/catalog/:tenderId', sourceController.getCatalogTender);
sourceRoutes.get('/snapshots', sourceController.getSnapshots);
sourceRoutes.get('/snapshots/:id', sourceController.getSnapshotById);

// Importing & uploading government records: OFFICIAL, ADMIN
sourceRoutes.post('/import', requireRole('OFFICIAL', 'ADMIN'), sourceController.importTender);
sourceRoutes.post('/upload', requireRole('OFFICIAL', 'ADMIN'), sourceController.uploadDataset);
