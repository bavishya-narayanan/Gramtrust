import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { userRepository } from '@/repositories/user.repository';
import { AppError } from '@/utils/app-error';

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
}

export const authService = {
  async login(email: string, password: string) {
    // 1. Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // 2. Check active
    if (!user.isActive) {
      throw new AppError('Account is disabled. Contact administrator.', 403);
    }

    // 3. Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // 4. Update last login
    await userRepository.updateLastLogin(user.id);

    // 5. Sign JWT
    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
  },
};
