import type { ApiError } from '@/shared/api';

import type { SearchResults } from './searchResults';

/** What the search area shows. The screen switches over `kind` exhaustively. */
export type SearchView =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'offline' }
  | { kind: 'error'; error: ApiError }
  | { kind: 'empty'; query: string }
  | {
      kind: 'results';
      results: SearchResults;
      /** Previous results kept on screen while a changed search loads. */
      isStale: boolean;
    };

interface SearchViewInput {
  /** The normalised query being searched; `undefined` when idle. */
  query: string | undefined;
  results: SearchResults | undefined;
  /** First-page error only; a failed "load more" keeps the results. */
  error: ApiError | undefined;
  isPaused: boolean;
  isStale: boolean;
}

/**
 * One decision, in priority order: rows on screen always win (offline or
 * failed refreshes keep showing them), then the error, then offline, then the
 * skeleton. An empty result is "no match" only for the current search; a
 * stale empty one says nothing about the new query, so it shows the skeleton.
 */
export function resolveSearchView({
  query,
  results,
  error,
  isPaused,
  isStale,
}: SearchViewInput): SearchView {
  if (query === undefined) return { kind: 'idle' };
  if (results !== undefined && results.repos.length > 0) {
    return { kind: 'results', results, isStale };
  }
  if (results !== undefined && !isStale) return { kind: 'empty', query };
  if (error !== undefined) return { kind: 'error', error };
  if (isPaused) return { kind: 'offline' };
  return { kind: 'loading' };
}
