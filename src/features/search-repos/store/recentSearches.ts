import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStorage, toStateStorage } from '@/shared/storage';

import { normalizeQuery, MIN_QUERY_LENGTH } from '../model/searchParams';

const MAX_RECENT_SEARCHES = 10;

interface RecentSearchesState {
  /** Most recent first, normalised, unique. */
  queries: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

/**
 * Recent searches, persisted in MMKV (ADR-0011): loaded synchronously, so the
 * idle screen shows them on the first frame. Client state, not server data
 * (ADR-0007).
 */
export const useRecentSearches = create<RecentSearchesState>()(
  persist(
    set => ({
      queries: [],
      add: raw => {
        const query = normalizeQuery(raw);
        if (query.length < MIN_QUERY_LENGTH) return;
        set(state => ({
          queries: [query, ...state.queries.filter(q => q !== query)].slice(
            0,
            MAX_RECENT_SEARCHES,
          ),
        }));
      },
      remove: query => {
        set(state => ({ queries: state.queries.filter(q => q !== query) }));
      },
      clear: () => {
        set({ queries: [] });
      },
    }),
    {
      name: 'recent-searches',
      version: 1,
      storage: createJSONStorage(() => toStateStorage(appStorage)),
      partialize: state => ({ queries: state.queries }),
      // Never trust storage blindly: anything unexpected falls back to empty.
      merge: (persisted, current) => {
        const queries: unknown =
          typeof persisted === 'object' &&
          persisted !== null &&
          'queries' in persisted
            ? persisted.queries
            : undefined;
        return isStringArray(queries)
          ? { ...current, queries: queries.slice(0, MAX_RECENT_SEARCHES) }
          : current;
      },
    },
  ),
);
