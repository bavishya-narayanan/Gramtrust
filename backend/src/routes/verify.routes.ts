import { Router } from 'express';
import { verifyController } from '@/controllers/verify.controller';
import { validateRequest } from '@/middlewares/validate.middleware';
import { verifySchema } from '@/validators/verify.validators';

export const verifyRoutes = Router();

verifyRoutes.post('/', validateRequest(verifySchema), verifyController.verifyAll);
verifyRoutes.get('/report', verifyController.report);
