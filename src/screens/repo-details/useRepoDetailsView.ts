import { useState } from 'react';

import { useOwner } from '@/entities/owner';
import { useRepository, type RepoRef } from '@/entities/repo';
import {
  useSavedAvatar,
  useSavedSnapshot,
  useSyncSnapshot,
} from '@/features/save-repo';
import { toApiError, useCoreBudgetLow } from '@/shared/api';

import {
  resolveOwnerSection,
  resolveRepoDetailsView,
} from './model/repoDetailsView';

const apiErrorOf = (error: Error | null) =>
  error === null ? undefined : toApiError(error);

/**
 * Everything Details needs, combined in the screen layer (ADR-0005, ADR-0020):
 * the repo (usually copied from search, ADR-0007) or its saved snapshot,
 * then its owner's profile, which waits while the core budget is at its
 * reserve unless the user asks for it (ADR-0012). A saved repo's snapshot
 * quietly follows the live data.
 */
export function useRepoDetailsView(ref: RepoRef) {
  const repoQuery = useRepository(ref);
  const snapshot = useSavedSnapshot(ref);
  const view = resolveRepoDetailsView({
    repo: repoQuery.data,
    snapshot,
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

  useSyncSnapshot({
    repo: repoQuery.data,
    fetchedAt: repoQuery.dataUpdatedAt,
    owner: ownerQuery.data,
  });
  // The avatar source is chosen once, when the repo first shows: the saved
  // copy if there is one, otherwise the network image. Saving or unsaving
  // while the screen is open then leaves the image alone; a new source would
  // remount it, and it would flicker through the initials.
  const storedAvatar = useSavedAvatar(repo?.owner.login);
  const [avatarChoice, setAvatarChoice] = useState<
    { uri: string | undefined } | undefined
  >();
  if (avatarChoice === undefined && repo !== undefined) {
    setAvatarChoice({ uri: storedAvatar });
  }
  const savedAvatarUri =
    avatarChoice === undefined ? storedAvatar : avatarChoice.uri;

  const [isRefreshing, setRefreshing] = useState(false);

  return {
    view,
    /**
     * The owner's avatar saved on the device, if the repo was saved when the
     * screen opened; kept for the screen's lifetime.
     */
    savedAvatarUri,
    ownerSection: resolveOwnerSection({
      profile: ownerQuery.data,
      savedProfile: snapshot?.owner,
      isSaved: snapshot !== undefined,
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
