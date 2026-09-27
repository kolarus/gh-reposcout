import type { SearchParams } from '../model/searchParams';

/** Query keys for search (ADR-0007). Never write them inline. */
export const searchKeys = {
  all: ['search'] as const,
  list: (params: SearchParams | undefined) =>
    [...searchKeys.all, 'list', params] as const,
};
