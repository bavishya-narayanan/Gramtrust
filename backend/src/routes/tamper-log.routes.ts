import { Router } from 'express';
import { tamperLogController } from '@/controllers/tamper-log.controller';

export const tamperLogRoutes = Router();

// GET /api/tamper-logs  — accessible to all authenticated users
tamperLogRoutes.get('/', tamperLogController.list);
