import type { RepoDetails } from '@/entities/repo';

import { SEARCH_PAGE_SIZE, SEARCH_RESULT_CAP } from './searchParams';

/** One page of search results, already mapped to domain types. */
export interface SearchPage {
  totalCount: number;
  /** GitHub timed out part of the search; results may be missing. */
  incompleteResults: boolean;
  items: RepoDetails[];
}

/** All loaded pages as one list. */
export interface SearchResults {
  repos: RepoDetails[];
  totalCount: number;
  incompleteResults: boolean;
}

/**
 * Next page number, or `undefined` when there's nothing more to load: a short
 * page, or GitHub's 1,000-result cap (asking past it returns a 422).
 */
export function getNextSearchPage(
  lastPage: SearchPage,
  _allPages: readonly SearchPage[],
  lastPageParam: number,
): number | undefined {
  const loaded = lastPageParam * SEARCH_PAGE_SIZE;
  const available = Math.min(lastPage.totalCount, SEARCH_RESULT_CAP);
  if (lastPage.items.length < SEARCH_PAGE_SIZE || loaded >= available) {
    return undefined;
  }
  return lastPageParam + 1;
}

/**
 * Flattens pages into one list, dropping repeats: rankings can shift between
 * page requests, so a repo may appear on two pages (ADR-0007).
 */
export function toSearchResults(data: {
  pages: readonly SearchPage[];
}): SearchResults {
  const seen = new Set<number>();
  const repos: RepoDetails[] = [];
  for (const page of data.pages) {
    for (const repo of page.items) {
      if (seen.has(repo.id)) continue;
      seen.add(repo.id);
      repos.push(repo);
    }
  }
  return {
    repos,
    totalCount: data.pages[0]?.totalCount ?? 0,
    incompleteResults: data.pages.some(page => page.incompleteResults),
  };
}

/** Whether the list stopped at GitHub's cap rather than at the real end. */
export const reachedResultCap = (results: SearchResults): boolean =>
  results.totalCount > SEARCH_RESULT_CAP &&
  results.repos.length >= SEARCH_RESULT_CAP - SEARCH_PAGE_SIZE;
