import { useState } from 'react';

import { useOwner } from '@/entities/owner';
import { useRepository, type RepoRef } from '@/entities/repo';
import { toApiError, useCoreBudgetLow } from '@/shared/api';

import {
  resolveOwnerSection,
  resolveRepoDetailsView,
} from './model/repoDetailsView';

const apiErrorOf = (error: Error | null) =>
  error === null ? undefined : toApiError(error);

/**
 * Everything Details needs, combined in the screen layer (ADR-0005, ADR-0020):
 * the repo (usually copied from search, ADR-0007), then its owner's profile,
 * which waits while the core budget is at its reserve unless the user asks
 * for it (ADR-0012).
 */
export function useRepoDetailsView(ref: RepoRef) {
  const repoQuery = useRepository(ref);
  const view = resolveRepoDetailsView({
    repo: repoQuery.data,
    error: apiErrorOf(repoQuery.error),
    isPaused: repoQuery.isPaused,
  });
  const repo = view.kind === 'repo' ? view.repo : undefined;

  const reserveResetAt = useCoreBudgetLow();
  const [ownerRequested, setOwnerRequested] = useState(false);
  const heldBackUntil = ownerRequested ? undefined : reserveResetAt;
  // The owner's login comes from the repo data, not the route: a renamed or
  // re-cased link would otherwise fetch the wrong (or a second) profile.
  const ownerQuery = useOwner(repo?.owner.login, {
    enabled: heldBackUntil === undefined,
  });

  const [isRefreshing, setRefreshing] = useState(false);

  return {
    view,
    ownerSection: resolveOwnerSection({
      profile: ownerQuery.data,
      error: apiErrorOf(ownerQuery.error),
      isPaused: ownerQuery.isPaused,
      heldBackUntil,
    }),
    isRefreshing,
    /** Pull-to-refresh: the repo only (one core request); the profile is cached for an hour. */
    refresh: async () => {
      setRefreshing(true);
      try {
        await repoQuery.refetch();
      } finally {
        setRefreshing(false);
      }
    },
    retry: () => {
      void repoQuery.refetch();
    },
    loadOwner: () => {
      setOwnerRequested(true);
    },
    retryOwner: () => {
      void ownerQuery.refetch();
    },
  };
}
