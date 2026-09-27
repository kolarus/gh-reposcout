import type { QueryClient } from '@tanstack/react-query';

import { fetchOwnerProfile } from '@/entities/owner';
import type { RepoDetails } from '@/entities/repo';
import { isCoreBudgetLow } from '@/shared/api';

import { keepOwnerAvatar } from './savedAvatars';
import { useSavedRepos } from '../store/savedRepos';

/**
 * Right after saving: store the owner's avatar, and add the owner's profile
 * if the core budget is above its reserve (ADR-0012, ADR-0020). The repo
 * itself is already complete. Anything missing is filled in by the next
 * online Details view (`useSyncSnapshot`).
 */
export async function completeSnapshot(
  queryClient: QueryClient,
  repo: RepoDetails,
): Promise<void> {
  const addOwner = async () => {
    if (isCoreBudgetLow()) return;
    try {
      const owner = await fetchOwnerProfile(queryClient, repo.owner.login);
      useSavedRepos.getState().setOwner(repo.id, owner);
    } catch {
      // Offline or failed: the next online Details view completes it.
    }
  };
  await Promise.all([keepOwnerAvatar(repo.owner), addOwner()]);
}
