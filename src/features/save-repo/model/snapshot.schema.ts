import { z } from 'zod';

import type { OwnerProfile } from '@/entities/owner';
import type { RepoDetails } from '@/entities/repo';

/*
 * Saved snapshots hold domain types (ADR-0020). JSON can't store `undefined`,
 * so the store writes it as `null`; these schemas read `null` back as
 * `undefined`. `satisfies` keeps them in step with the domain types: a field
 * added to `RepoDetails` fails to compile here until the schema has it.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  schema.nullable().transform(value => value ?? undefined);

const savedRepoSchema = z.object({
  id: z.number(),
  owner: z.object({
    login: z.string(),
    avatarUrl: z.string(),
    kind: z.enum(['user', 'organization']),
  }),
  name: z.string(),
  fullName: z.string(),
  description: optional(z.string()),
  htmlUrl: z.string(),
  homepageUrl: optional(z.string()),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  language: optional(z.string()),
  license: optional(z.string()),
  topics: z.array(z.string()),
  defaultBranch: z.string(),
  sizeKb: z.number(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  pushedAt: optional(z.string()),
}) satisfies z.ZodType<RepoDetails>;

const savedOwnerSchema = z.object({
  login: z.string(),
  name: optional(z.string()),
  avatarUrl: z.string(),
  htmlUrl: z.string(),
  kind: z.enum(['user', 'organization']),
  bio: optional(z.string()),
  company: optional(z.string()),
  location: optional(z.string()),
  blogUrl: optional(z.string()),
  followers: z.number(),
  publicRepos: z.number(),
}) satisfies z.ZodType<OwnerProfile>;

/** Version 1 of a saved repo. A new version adds a `migrate` step (ADR-0011). */
export const snapshotSchema = z.object({
  version: z.literal(1),
  savedAt: z.string(),
  /** When the repo data was last known to be current. */
  refreshedAt: z.string(),
  repo: savedRepoSchema,
  /** Missing until the profile has been loaded once (ADR-0012 reserve). */
  owner: optional(savedOwnerSchema),
});

export type SavedRepoSnapshot = z.infer<typeof snapshotSchema>;
