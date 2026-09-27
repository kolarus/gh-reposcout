import { repoSchema, toRepoDetails } from '@/entities/repo';
import type { ApiError } from '@/shared/api';
import { buildRepoDto } from '@/test/github';

import { resolveOwnerSection, resolveRepoDetailsView } from './repoDetailsView';

const repo = toRepoDetails(repoSchema.parse(buildRepoDto(1)));
const RESET = '2026-09-26T13:00:00Z';
const network: ApiError = { kind: 'network' };
const notFound: ApiError = { kind: 'not-found' };
const limited: ApiError = {
  kind: 'rate-limited',
  resource: 'core',
  resetAt: RESET,
};

describe('resolveRepoDetailsView (ADR-0020 rows without a snapshot)', () => {
  it.each([
    [
      'loading',
      { repo: undefined, error: undefined, isPaused: false },
      { kind: 'loading' },
    ],
    [
      'offline, nothing cached',
      { repo: undefined, error: undefined, isPaused: true },
      { kind: 'offline' },
    ],
    [
      'data (live or from search)',
      { repo, error: undefined, isPaused: false },
      { kind: 'repo', repo, notice: undefined },
    ],
    [
      'data, offline',
      { repo, error: undefined, isPaused: true },
      { kind: 'repo', repo, notice: undefined },
    ],
    [
      'data, refresh failed',
      { repo, error: network, isPaused: false },
      { kind: 'repo', repo, notice: { kind: 'refresh-failed' } },
    ],
    [
      'data, core limit used up',
      { repo, error: limited, isPaused: false },
      { kind: 'repo', repo, notice: { kind: 'rate-limited', resetAt: RESET } },
    ],
    [
      'no data, core limit used up',
      { repo: undefined, error: limited, isPaused: false },
      { kind: 'rate-limited', resetAt: RESET },
    ],
    [
      'no data, network error',
      { repo: undefined, error: network, isPaused: false },
      { kind: 'error', error: network },
    ],
    [
      '404',
      { repo: undefined, error: notFound, isPaused: false },
      { kind: 'not-found' },
    ],
    // GitHub says it's gone: data from an earlier search is out of date.
    [
      '404 over data from search',
      { repo, error: notFound, isPaused: false },
      { kind: 'not-found' },
    ],
  ] as const)('%s', (_, input, expected) => {
    expect(resolveRepoDetailsView(input)).toEqual(expected);
  });
});

describe('resolveOwnerSection', () => {
  const profile = {
    login: 'owner-1',
    name: undefined,
    avatarUrl: 'https://a.test/o',
    htmlUrl: 'https://github.com/owner-1',
    kind: 'user' as const,
    bio: undefined,
    company: undefined,
    location: undefined,
    blogUrl: undefined,
    followers: 1,
    publicRepos: 1,
  };
  const base = {
    profile: undefined,
    error: undefined,
    isPaused: false,
    heldBackUntil: undefined,
  };

  it.each([
    [
      'a loaded profile, even over an error or the reserve',
      { ...base, profile, error: network, heldBackUntil: RESET },
      { kind: 'profile', profile },
    ],
    [
      'rate limited',
      { ...base, error: limited },
      { kind: 'rate-limited', resetAt: RESET },
    ],
    ['failed', { ...base, error: network }, { kind: 'error' }],
    [
      'held back by the reserve',
      { ...base, heldBackUntil: RESET },
      { kind: 'paused', resetAt: RESET },
    ],
    ['offline', { ...base, isPaused: true }, { kind: 'offline' }],
    ['loading', base, { kind: 'loading' }],
  ] as const)('%s', (_, input, expected) => {
    expect(resolveOwnerSection(input)).toEqual(expected);
  });
});
