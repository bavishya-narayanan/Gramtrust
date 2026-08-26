import { Router } from 'express';
import { projectController } from '@/controllers/project.controller';
import { validateRequest } from '@/middlewares/validate.middleware';
import { projectCodeSchema, projectCreateSchema, projectUpdateSchema } from '@/validators/project.validators';

export const projectRoutes = Router();

projectRoutes.get('/', projectController.list);
projectRoutes.get('/:id', validateRequest(projectCodeSchema, 'params'), projectController.getById);
projectRoutes.post('/', validateRequest(projectCreateSchema), projectController.create);
projectRoutes.put('/:id', validateRequest(projectCodeSchema, 'params'), validateRequest(projectUpdateSchema), projectController.update);
projectRoutes.delete('/:id', validateRequest(projectCodeSchema, 'params'), projectController.remove);
projectRoutes.post('/:id/verify', validateRequest(projectCodeSchema, 'params'), projectController.verify);
projectRoutes.get('/:id/transactions', validateRequest(projectCodeSchema, 'params'), projectController.history);
