import { Router } from 'express';
import multer from 'multer';
import { importController } from '@/controllers/import.controller';
import { validateRequest } from '@/middlewares/validate.middleware';
import { importSchema } from '@/validators/import.validators';

const upload = multer({ storage: multer.memoryStorage() });

export const importRoutes = Router();

importRoutes.post('/', upload.single('file'), validateRequest(importSchema), importController.importCsv);
