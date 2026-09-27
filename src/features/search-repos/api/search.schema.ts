import { z } from 'zod';

import { repoSchema } from '@/entities/repo';

/** `GET /search/repositories` (ADR-0008); items reuse the repo entity's schema. */
export const searchResponseSchema = z.object({
  total_count: z.number(),
  incomplete_results: z.boolean(),
  items: z.array(repoSchema),
});
