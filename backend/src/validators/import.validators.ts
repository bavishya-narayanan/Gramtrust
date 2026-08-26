import { z } from 'zod';

export const importSchema = z.object({
  csvText: z.string().min(1).optional(),
});
