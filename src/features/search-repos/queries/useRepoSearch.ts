import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';

import { toApiError, useRateLimit, type ApiError } from '@/shared/api';
import { runAt, useDebouncedValue } from '@/shared/lib';

import { keepFirstPage, searchQueryOptions } from './searchQuery';
import {
  SEARCH_DEBOUNCE_MS,
  toSearchParams,
  type SearchParams,
  type SearchSort,
} from '../model/searchParams';
import { toSearchResults } from '../model/searchResults';
import { resolveSearchView, type SearchView } from '../model/searchView';
import { useRecentSearches } from '../store/recentSearches';

/** Extra wait after a rate-limit reset, so clock skew doesn't hit the limit again. */
const LIMIT_RESET_GRACE_MS = 1000;

export interface RepoSearch {
  /** The normalised search in effect; `undefined` while idle. */
  params: SearchParams | undefined;
  view: SearchView;
  /**
   * A new search is on its way: typing hasn't paused yet, or its first page
   * is loading (skeleton or veiled previous results). Not set for "load
   * more" or pull-to-refresh, which have their own spinners.
   */
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** A failed "load more"; the loaded results stay on screen. */
  nextPageError: ApiError | undefined;
  /** When the search budget refills, while it's exhausted (ADR-0012). */
  rateLimitResetAt: string | undefined;
  isRefreshing: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
  /** Searches `text` now, skipping the debounce, and remembers it as recent. */
  submit: (text: string) => void;
}

/**
 * Repository search as the screen needs it (ADR-0007, ADR-0012): typing is
 * debounced, stale requests are cancelled by TanStack Query's signal, pages
 * load on demand up to GitHub's cap, and the previous results stay (dimmed)
 * while a changed search loads, so the list never flashes back to a skeleton.
 */
export function useRepoSearch(text: string, sort: SearchSort): RepoSearch {
  const queryClient = useQueryClient();
  const addRecent = useRecentSearches(state => state.add);
  const [submittedText, setSubmittedText] = useState<string>();
  const [isRefreshing, setRefreshing] = useState(false);
  const debouncedText = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  const typedParams = toSearchParams(text, sort);
  // A submitted query, or one cleared below the minimum length, applies at
  // once; anything else waits for typing to pause.
  const params =
    submittedText === text || typedParams === undefined
      ? typedParams
      : toSearchParams(debouncedText, sort);
  const isSettling = typedParams?.query !== params?.query;

  const query = useInfiniteQuery({
    ...searchQueryOptions(params),
    select: toSearchResults,
    placeholderData: previous => (params === undefined ? undefined : previous),
  });

  const error = query.error === null ? undefined : toApiError(query.error);
  const searchBucket = useRateLimit(state => state.buckets.search);
  const errorResetAt =
    error?.kind === 'rate-limited' ? error.resetAt : undefined;
  const bucketResetAt =
    searchBucket?.remaining === 0 ? searchBucket.resetAt : undefined;

  const retry = () => {
    if (query.isFetchNextPageError) void query.fetchNextPage();
    else void query.refetch();
  };

  // Rate-limited requests are never retried by the query client (ADR-0018);
  // this resumes the search once GitHub's reset time has passed.
  const resumeAfterLimit = useEffectEvent(retry);
  useEffect(() => {
    if (errorResetAt === undefined) return;
    return runAt(
      errorResetAt,
      () => {
        resumeAfterLimit();
      },
      LIMIT_RESET_GRACE_MS,
    );
  }, [errorResetAt]);

  const view = resolveSearchView({
    query: params?.query,
    results: query.data,
    error: query.isFetchNextPageError ? undefined : error,
    isPaused: query.isPaused,
    isStale: query.isPlaceholderData || isSettling,
  });

  return {
    params,
    view,
    isPending:
      isSettling ||
      view.kind === 'loading' ||
      (view.kind === 'results' && view.isStale),
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    nextPageError: query.isFetchNextPageError ? error : undefined,
    rateLimitResetAt: errorResetAt ?? bucketResetAt,
    isRefreshing,
    loadMore: () => {
      if (
        query.hasNextPage &&
        !query.isFetching &&
        !query.isFetchNextPageError &&
        !query.isPlaceholderData
      ) {
        void query.fetchNextPage();
      }
    },
    refresh: async () => {
      if (params === undefined) return;
      setRefreshing(true);
      queryClient.setQueryData(
        searchQueryOptions(params).queryKey,
        keepFirstPage,
      );
      try {
        await query.refetch();
      } finally {
        setRefreshing(false);
      }
    },
    retry,
    submit: value => {
      setSubmittedText(value);
      addRecent(value);
    },
  };
}
