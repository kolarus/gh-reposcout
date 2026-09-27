import { appConfig } from '@/shared/config';

import searchFixture from './fixtures/search-repositories.json';

/**
 * GitHub test data built from a real captured response
 * (`fixtures/search-repositories.json`, `GET /search/repositories?q=react
 * native`), so fakes keep GitHub's real shape (ADR-0013).
 */
export const SEARCH_URL = `${appConfig.github.apiUrl}/search/repositories`;

/** The captured search response, untouched: for contract tests. */
export const capturedSearchResponse: unknown = searchFixture;

const baseItem = (() => {
  const [first] = searchFixture.items;
  if (first === undefined) throw new Error('The search fixture has no items.');
  return first;
})();

/** A repository as GitHub returns it, with a unique id and name. */
export function buildRepoDto(
  id: number,
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    ...baseItem,
    id,
    name: `repo-${String(id)}`,
    full_name: `owner-${String(id)}/repo-${String(id)}`,
    owner: { ...baseItem.owner, login: `owner-${String(id)}` },
    ...overrides,
  };
}

/**
 * One page of search results: items `(page - 1) * perPage + 1 …`, the last
 * page cut short by `total`.
 */
export function buildSearchPage({
  page,
  total,
  perPage = 100,
  incomplete = false,
}: {
  page: number;
  total: number;
  perPage?: number;
  incomplete?: boolean;
}): Record<string, unknown> {
  const first = (page - 1) * perPage + 1;
  const count = Math.max(0, Math.min(perPage, total - first + 1));
  return {
    total_count: total,
    incomplete_results: incomplete,
    items: Array.from({ length: count }, (_, i) => buildRepoDto(first + i)),
  };
}
