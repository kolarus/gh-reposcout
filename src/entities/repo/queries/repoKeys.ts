import type { RepoRef } from '../model/repoRef';

/** Query keys for repositories (ADR-0007). Never write them inline. */
export const repoKeys = {
  all: ['repo'] as const,
  // Lowercased: GitHub names are case-insensitive, so a link with different
  // casing still finds the same cache entry.
  detail: ({ owner, name }: RepoRef) =>
    [...repoKeys.all, 'detail', `${owner}/${name}`.toLowerCase()] as const,
};
