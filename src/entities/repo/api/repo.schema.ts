import { z } from 'zod';

/**
 * GitHub's repository shape as returned by search (ADR-0008). Only the fields
 * the app uses; unknown fields are stripped, so additions on GitHub's side
 * can't break parsing. Grows with Details in Phase 3.
 */
export const repoSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
  }),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
  updated_at: z.string(),
});

export type RepoSummaryDto = z.infer<typeof repoSummarySchema>;
