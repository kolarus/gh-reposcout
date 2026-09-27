import { githubClient } from '@/shared/api';

import { repoSchema } from './repo.schema';
import { toRepoDetails } from '../model/mappers';
import type { RepoRef } from '../model/repoRef';
import type { RepoDetails } from '../model/types';

/**
 * `GET /repos/{owner}/{name}` (ADR-0008). GitHub redirects renamed repos and
 * fetch follows, so the result's `fullName` is the current one.
 */
export async function fetchRepository(
  { owner, name }: RepoRef,
  signal?: AbortSignal,
): Promise<RepoDetails> {
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const dto = await githubClient.get(path, repoSchema, { signal });
  return toRepoDetails(dto);
}
