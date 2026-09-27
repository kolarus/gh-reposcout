import {
  infiniteQueryOptions,
  skipToken,
  type InfiniteData,
} from '@tanstack/react-query';

import { searchKeys } from './searchKeys';
import { searchRepositories } from '../api/searchRepositories';
import type { SearchParams } from '../model/searchParams';
import { getNextSearchPage } from '../model/searchResults';

const SEARCH_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * The infinite search query (ADR-0007, ADR-0012). Refetching a stale infinite
 * query refetches every loaded page, and ten pages would spend the whole
 * minute's search budget at once. So:
 * - focus and reconnect never refetch;
 * - a search goes stale after 5 minutes only while one page is loaded;
 *   with more, it stays as loaded until pull-to-refresh (`keepFirstPage`).
 *   This has to be `staleTime`: switching back to a cached search refetches
 *   whenever it's stale, regardless of `refetchOnMount`.
 */
export const searchQueryOptions = (params: SearchParams | undefined) =>
  infiniteQueryOptions({
    queryKey: searchKeys.list(params),
    queryFn:
      params === undefined
        ? skipToken
        : ({ pageParam, signal }) =>
            searchRepositories(params, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: getNextSearchPage,
    staleTime: query =>
      (query.state.data?.pages.length ?? 0) > 1
        ? Infinity
        : SEARCH_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * Drops every page but the first, so the following refetch costs exactly one
 * request, while page 1 stays on screen (no skeleton flash during a refresh).
 */
export const keepFirstPage = <TPage, TPageParam>(
  data: InfiniteData<TPage, TPageParam> | undefined,
): InfiniteData<TPage, TPageParam> | undefined =>
  data === undefined
    ? undefined
    : {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      };
