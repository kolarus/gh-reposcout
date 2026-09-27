/** Sort orders offered in the UI; `best-match` is GitHub's default ranking. */
export type SearchSort = 'best-match' | 'stars' | 'updated';

export const SEARCH_SORTS: readonly SearchSort[] = [
  'best-match',
  'stars',
  'updated',
];

/** A search as sent to GitHub and used in the cache key: always normalised. */
export interface SearchParams {
  query: string;
  sort: SearchSort;
}

/*
 * Budget rules (ADR-0012): GitHub allows 10 unauthenticated searches a minute
 * and returns at most the first 1,000 results of any search.
 */
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 400;
/** The brief asks for 100 per page, which is also GitHub's maximum. */
export const SEARCH_PAGE_SIZE = 100;
export const SEARCH_RESULT_CAP = 1000;

/**
 * Trim, collapse whitespace, lowercase: GitHub search is case-insensitive, so
 * "React  Native" and "react native" share one request and one cache entry.
 * Qualifiers such as `language:go` pass through untouched (ADR-0008).
 */
export function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** `undefined` until the query is long enough to search (the idle state). */
export function toSearchParams(
  raw: string,
  sort: SearchSort,
): SearchParams | undefined {
  const query = normalizeQuery(raw);
  return query.length >= MIN_QUERY_LENGTH ? { query, sort } : undefined;
}

/** GitHub's `sort`/`order` parameters; best match sends neither. */
export function toApiSort(sort: SearchSort): {
  sort: 'stars' | 'updated' | undefined;
  order: 'desc' | undefined;
} {
  switch (sort) {
    case 'best-match':
      return { sort: undefined, order: undefined };
    case 'stars':
      return { sort: 'stars', order: 'desc' };
    case 'updated':
      return { sort: 'updated', order: 'desc' };
  }
}
