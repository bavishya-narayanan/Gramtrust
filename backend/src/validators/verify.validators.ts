import { z } from 'zod';

export const verifySchema = z.object({
  projectCode: z.string().trim().min(2).max(32).optional(),
});
