import {
  queryOptions,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';

import { repoKeys } from './repoKeys';
import { fetchRepository } from '../api/fetchRepository';
import type { RepoRef } from '../model/repoRef';
import type { RepoDetails } from '../model/types';

const REPO_STALE_TIME_MS = 10 * 60 * 1000;

const repoQueryOptions = (ref: RepoRef) =>
  queryOptions({
    queryKey: repoKeys.detail(ref),
    queryFn: ({ signal }) => fetchRepository(ref, signal),
    staleTime: REPO_STALE_TIME_MS,
  });

/**
 * One repository (ADR-0007). Usually already in the cache, copied from search
 * (`seedRepoDetail`), so no request is made while that data is fresh; deep
 * links fetch it (ADR-0012).
 */
export function useRepository(ref: RepoRef) {
  return useQuery(repoQueryOptions(ref));
}

/**
 * Copies a repo from search results into the Details cache, stamped with when
 * the search ran (ADR-0007): Details opens instantly, and makes no request
 * until that data is older than its `staleTime` (ADR-0012). Never replaces
 * newer data, e.g. from a Details view loaded a minute ago.
 */
export function seedRepoDetail(
  queryClient: QueryClient,
  repo: RepoDetails,
  fetchedAt: number,
): void {
  const { queryKey } = repoQueryOptions({
    owner: repo.owner.login,
    name: repo.name,
  });
  const current = queryClient.getQueryState(queryKey);
  if (current?.data !== undefined && current.dataUpdatedAt >= fetchedAt) {
    return;
  }
  queryClient.setQueryData(queryKey, repo, { updatedAt: fetchedAt });
}
