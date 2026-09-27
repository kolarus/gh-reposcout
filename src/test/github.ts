import { appConfig } from '@/shared/config';

import repositoryFixture from './fixtures/repository.json';
import searchFixture from './fixtures/search-repositories.json';
import userFixture from './fixtures/user.json';

/**
 * GitHub test data built from real captured responses, so fakes keep GitHub's
 * real shape (ADR-0013):
 * - `fixtures/search-repositories.json`: `GET /search/repositories?q=react native`
 * - `fixtures/repository.json`: `GET /repos/react/react-native`
 * - `fixtures/user.json`: `GET /users/react`
 */
const API = appConfig.github.apiUrl;
export const SEARCH_URL = `${API}/search/repositories`;
/** MSW path pattern for `GET /repos/{owner}/{name}`. */
export const REPO_URL = `${API}/repos/:owner/:name`;
/** MSW path pattern for `GET /users/{login}`. */
export const USER_URL = `${API}/users/:login`;

/** The captured responses, untouched: for contract tests. */
export const capturedSearchResponse: unknown = searchFixture;
export const capturedRepository: unknown = repositoryFixture;
export const capturedUser: unknown = userFixture;

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

/** A profile as `GET /users/{login}` returns it. */
export function buildUserDto(
  login: string,
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    ...userFixture,
    login,
    html_url: `https://github.com/${login}`,
    ...overrides,
  };
}

/** MSW pattern for GitHub's avatar CDN (not the API: no rate limit). */
export const AVATAR_URL = 'https://avatars.githubusercontent.com/*';

/** A tiny stand-in avatar: 3 bytes of "PNG", enough to check the data URI. */
export const AVATAR_BYTES = new Uint8Array([0x89, 0x50, 0x4e]);
export const AVATAR_DATA_URI = 'data:image/png;base64,iVBO';
