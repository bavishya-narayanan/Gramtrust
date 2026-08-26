import { Router } from 'express';
import { actionsController } from '@/controllers/actions.controller';

export const actionsRoutes = Router();

actionsRoutes.post('/import-dataset', actionsController.importDataset);
actionsRoutes.post('/store-records', actionsController.storeRecords);
actionsRoutes.post('/simulate-tampering', actionsController.simulateTampering);
actionsRoutes.post('/verify-blockchain', actionsController.verifyBlockchain);