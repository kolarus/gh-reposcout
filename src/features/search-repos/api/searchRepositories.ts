import { toRepoSummary } from '@/entities/repo';
import { githubClient } from '@/shared/api';

import { searchResponseSchema } from './search.schema';
import {
  SEARCH_PAGE_SIZE,
  toApiSort,
  type SearchParams,
} from '../model/searchParams';
import type { SearchPage } from '../model/searchResults';

/** Fetches one page of repository search results (ADR-0008, ADR-0012). */
export async function searchRepositories(
  params: SearchParams,
  page: number,
  signal?: AbortSignal,
): Promise<SearchPage> {
  const { sort, order } = toApiSort(params.sort);
  const body = await githubClient.get(
    '/search/repositories',
    searchResponseSchema,
    {
      signal,
      query: {
        q: params.query,
        sort,
        order,
        per_page: SEARCH_PAGE_SIZE,
        page,
      },
    },
  );
  return {
    totalCount: body.total_count,
    incompleteResults: body.incomplete_results,
    items: body.items.map(toRepoSummary),
  };
}
