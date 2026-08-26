import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';

export const authRoutes = Router();

// POST /api/auth/login
authRoutes.post('/login', authController.login);

// GET /api/auth/me  (requires valid JWT)
authRoutes.get('/me', authenticate, authController.me);
