import { Router } from 'express';
import { blockchainController } from '@/controllers/blockchain.controller';
import { validateRequest } from '@/middlewares/validate.middleware';
import { blockchainActionSchema } from '@/validators/blockchain.validators';

export const blockchainRoutes = Router();

blockchainRoutes.post('/store', validateRequest(blockchainActionSchema), blockchainController.store);
blockchainRoutes.get('/:id/history', blockchainController.history);
