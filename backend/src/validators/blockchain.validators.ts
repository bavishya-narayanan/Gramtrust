import { z } from 'zod';

export const blockchainActionSchema = z.object({
  projectCode: z.string().trim().min(2).max(32).optional(),
});
