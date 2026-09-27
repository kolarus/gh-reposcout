import { z } from 'zod';

/**
 * GitHub's repository shape (ADR-0008), as returned both by search and by
 * `GET /repos/{owner}/{name}`. Only the fields the app uses; unknown fields
 * are stripped, so additions on GitHub's side can't break parsing. Search
 * results carry all of them, which is why opening a result costs no request
 * (ADR-0012).
 */
export const repoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
    type: z.string(),
  }),
  description: z.string().nullable(),
  html_url: z.string(),
  homepage: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  language: z.string().nullable(),
  license: z
    .object({ name: z.string(), spdx_id: z.string().nullable() })
    .nullable(),
  topics: z.array(z.string()).default([]),
  default_branch: z.string(),
  // Kilobytes.
  size: z.number(),
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  // Null for a repository nobody has pushed to yet.
  pushed_at: z.string().nullable(),
});

export type RepoDto = z.infer<typeof repoSchema>;
