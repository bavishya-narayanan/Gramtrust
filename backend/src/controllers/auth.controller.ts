import type { Request, Response } from 'express';
import { authService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { AppError } from '@/utils/app-error';
import { asyncHandler } from '@/utils/async-handler';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message || 'Invalid login payload', 400);
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById((req as any).user.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json({ success: true, data: user });
  }),
};
