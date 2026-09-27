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
      /**
       * The previous search's results, kept on screen (veiled, not
       * interactive) while the changed search loads.
       */
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
 * One decision, in priority order:
 * 1. The current search's own rows always win, even offline or after a failed
 *    refresh (the offline banner explains).
 * 2. "No match", but only for the current search: a stale empty result says
 *    nothing about the new query.
 * 3. The error, then offline.
 * 4. The previous search's rows, veiled, while the new one loads. Not offline:
 *    they'd stay on screen, veiled, until the device reconnects, answering a
 *    question the user no longer asked.
 * 5. The skeleton.
 */
export function resolveSearchView({
  query,
  results,
  error,
  isPaused,
  isStale,
}: SearchViewInput): SearchView {
  if (query === undefined) return { kind: 'idle' };
  const hasRows = results !== undefined && results.repos.length > 0;
  if (results !== undefined && hasRows && !isStale) {
    return { kind: 'results', results, isStale: false };
  }
  if (results !== undefined && !isStale) return { kind: 'empty', query };
  if (error !== undefined) return { kind: 'error', error };
  if (isPaused) return { kind: 'offline' };
  if (results !== undefined && hasRows) {
    return { kind: 'results', results, isStale: true };
  }
  return { kind: 'loading' };
}
