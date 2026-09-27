import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { OwnerProfile } from '@/entities/owner';
import type { RepoDetails } from '@/entities/repo';
import { monitoring } from '@/shared/monitoring';
import { savedReposStorage, toStateStorage } from '@/shared/storage';

import {
  fullNameKey,
  restoreSaved,
  type SavedRepos,
} from '../model/restoreSaved';

/** Past this many, saving still works but is logged (ADR-0020). */
const SOFT_CAP = 500;

interface SavedReposState extends SavedRepos {
  save: (repo: RepoDetails) => void;
  remove: (id: number) => void;
  /** Newer data for a saved repo: its snapshot quietly follows (ADR-0020). */
  refresh: (repo: RepoDetails, fetchedAt: number) => void;
  setOwner: (repoId: number, owner: OwnerProfile) => void;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

const without = <T>(
  record: Record<string, T>,
  key: string,
): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));

/**
 * Saved repositories with their offline snapshots (ADR-0020), persisted in
 * their own MMKV instance and loaded synchronously. Client state the user
 * owns, so it lives in Zustand rather than the query cache (ADR-0007).
 */
export const useSavedRepos = create<SavedReposState>()(
  persist(
    set => ({
      byId: {},
      order: [],
      idByFullName: {},
      save: repo => {
        set(state => {
          if (state.byId[String(repo.id)] !== undefined) return state;
          if (state.order.length >= SOFT_CAP) {
            monitoring.log('Saved repos past the soft cap', {
              count: state.order.length + 1,
            });
          }
          const now = new Date().toISOString();
          return {
            byId: {
              ...state.byId,
              [String(repo.id)]: {
                version: 1,
                savedAt: now,
                refreshedAt: now,
                repo,
                owner: undefined,
              },
            },
            order: [repo.id, ...state.order],
            idByFullName: {
              ...state.idByFullName,
              [fullNameKey(repo.fullName)]: repo.id,
            },
          };
        });
      },
      remove: id => {
        set(state => {
          const snapshot = state.byId[String(id)];
          if (snapshot === undefined) return state;
          return {
            byId: without(state.byId, String(id)),
            order: state.order.filter(saved => saved !== id),
            idByFullName: without(
              state.idByFullName,
              fullNameKey(snapshot.repo.fullName),
            ),
          };
        });
      },
      refresh: (repo, fetchedAt) => {
        set(state => {
          const snapshot = state.byId[String(repo.id)];
          if (
            snapshot === undefined ||
            fetchedAt <= Date.parse(snapshot.refreshedAt) ||
            same(snapshot.repo, repo)
          ) {
            return state;
          }
          const others = without(
            state.idByFullName,
            fullNameKey(snapshot.repo.fullName),
          );
          return {
            byId: {
              ...state.byId,
              [String(repo.id)]: {
                ...snapshot,
                repo,
                refreshedAt: new Date(fetchedAt).toISOString(),
              },
            },
            // A rename moves the index entry to the new name.
            idByFullName: { ...others, [fullNameKey(repo.fullName)]: repo.id },
          };
        });
      },
      setOwner: (repoId, owner) => {
        set(state => {
          const snapshot = state.byId[String(repoId)];
          if (snapshot === undefined || same(snapshot.owner, owner))
            return state;
          return {
            byId: { ...state.byId, [String(repoId)]: { ...snapshot, owner } },
          };
        });
      },
    }),
    {
      name: 'saved-repos',
      version: 1,
      storage: createJSONStorage(() => toStateStorage(savedReposStorage), {
        // JSON drops `undefined`; store it as `null` so every field survives
        // (the snapshot schema reads it back as `undefined`).
        replacer: (_key, value: unknown) =>
          value === undefined ? null : value,
      }),
      partialize: state => ({ byId: state.byId, order: state.order }),
      merge: (persisted, current) => {
        const { saved, dropped } = restoreSaved(persisted);
        if (dropped > 0) {
          monitoring.log('Dropped saved repos that failed validation', {
            dropped,
          });
        }
        return { ...current, ...saved };
      },
    },
  ),
);
