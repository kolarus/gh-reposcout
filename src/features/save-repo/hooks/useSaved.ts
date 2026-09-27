import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { OwnerProfile } from '@/entities/owner';
import type { RepoDetails, RepoRef } from '@/entities/repo';
import { savedAvatarStorage, useStoredString } from '@/shared/storage';

import { completeSnapshot } from '../lib/completeSnapshot';
import {
  avatarKey,
  keepOwnerAvatar,
  releaseAllAvatars,
  releaseOwnerAvatar,
} from '../lib/savedAvatars';
import { fullNameKey } from '../model/restoreSaved';
import type { SavedRepoSnapshot } from '../model/types';
import { useSavedRepos } from '../store/savedRepos';

/** Whether one repo is saved. An O(1) selector: only that repo's rows re-render. */
export const useIsSaved = (id: number): boolean =>
  useSavedRepos(state => state.byId[String(id)] !== undefined);

/** How many repos are saved. */
export const useSavedCount = (): number =>
  useSavedRepos(state => state.order.length);

/** Saved snapshots, most recently saved first. */
export const useSavedList = (): SavedRepoSnapshot[] =>
  useSavedRepos(
    useShallow(state =>
      state.order.flatMap(id => state.byId[String(id)] ?? []),
    ),
  );

/** The snapshot for a route's owner and name, if that repo is saved. */
export function useSavedSnapshot({
  owner,
  name,
}: RepoRef): SavedRepoSnapshot | undefined {
  return useSavedRepos(state => {
    const id = state.idByFullName[fullNameKey(`${owner}/${name}`)];
    return id === undefined ? undefined : state.byId[String(id)];
  });
}

/** An owner's saved avatar as a data URI, if one is stored. */
export const useSavedAvatar = (login: string | undefined): string | undefined =>
  useStoredString(
    savedAvatarStorage,
    login === undefined ? undefined : avatarKey(login),
  );

/**
 * Save or unsave. Saving stores the snapshot at once and completes it in the
 * background (avatar, owner profile within budget); unsaving deletes the
 * owner's avatar once none of their repos is saved.
 */
export function useToggleSaved(): (repo: RepoDetails) => void {
  const queryClient = useQueryClient();
  return repo => {
    const store = useSavedRepos.getState();
    if (store.byId[String(repo.id)] !== undefined) {
      store.remove(repo.id);
      releaseOwnerAvatar(repo.owner.login);
      return;
    }
    store.save(repo);
    void completeSnapshot(queryClient, repo);
  };
}

/** Removes every saved repo and its avatar (Settings → Data). */
export function clearSavedRepos(): void {
  useSavedRepos.getState().clear();
  releaseAllAvatars();
}

/**
 * Keeps a saved repo's snapshot in step with what Details loaded (ADR-0020):
 * newer repo data, the owner profile, and a missing avatar, quietly.
 */
export function useSyncSnapshot({
  repo,
  fetchedAt,
  owner,
}: {
  repo: RepoDetails | undefined;
  fetchedAt: number;
  owner: OwnerProfile | undefined;
}): void {
  const isSaved = useSavedRepos(
    state => repo !== undefined && state.byId[String(repo.id)] !== undefined,
  );
  useEffect(() => {
    if (!isSaved || repo === undefined) return;
    const store = useSavedRepos.getState();
    store.refresh(repo, fetchedAt);
    if (owner !== undefined) store.setOwner(repo.id, owner);
    void keepOwnerAvatar(repo.owner);
  }, [isSaved, repo, fetchedAt, owner]);
}
