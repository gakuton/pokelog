import { z } from 'zod';

export const seasonSchema = z.object({
  name: z.string().min(1).max(100),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export type SeasonInput = z.infer<typeof seasonSchema>;
