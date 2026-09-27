import { repoSchema, toRepoDetails } from '@/entities/repo';
import type { SavedRepoSnapshot } from '@/features/save-repo';
import type { ApiError } from '@/shared/api';
import { buildRepoDto } from '@/test/github';

import { resolveOwnerSection, resolveRepoDetailsView } from './repoDetailsView';

const repo = toRepoDetails(repoSchema.parse(buildRepoDto(1)));
const savedRepo = { ...repo, description: 'as saved' };
const snapshot: SavedRepoSnapshot = {
  version: 1,
  savedAt: '2026-09-20T10:00:00Z',
  refreshedAt: '2026-09-23T10:00:00Z',
  repo: savedRepo,
  owner: undefined,
};
const RESET = '2026-09-26T13:00:00Z';
const network: ApiError = { kind: 'network' };
const server: ApiError = { kind: 'http', status: 502 };
const notFound: ApiError = { kind: 'not-found' };
const limited: ApiError = {
  kind: 'rate-limited',
  resource: 'core',
  resetAt: RESET,
};
const savedCopy = {
  kind: 'saved-copy',
  refreshedAt: snapshot.refreshedAt,
} as const;
const none = {
  repo: undefined,
  snapshot: undefined,
  error: undefined,
  isPaused: false,
};

describe('resolveRepoDetailsView: without a snapshot', () => {
  it.each([
    ['loading', none, { kind: 'loading' }],
    [
      'offline, nothing cached',
      { ...none, isPaused: true },
      { kind: 'offline' },
    ],
    [
      'data (live or from search)',
      { ...none, repo },
      { kind: 'repo', repo, notice: undefined },
    ],
    [
      'data, offline',
      { ...none, repo, isPaused: true },
      { kind: 'repo', repo, notice: undefined },
    ],
    [
      'data, refresh failed',
      { ...none, repo, error: network },
      { kind: 'repo', repo, notice: { kind: 'refresh-failed' } },
    ],
    [
      'data, core limit used up',
      { ...none, repo, error: limited },
      { kind: 'repo', repo, notice: { kind: 'rate-limited', resetAt: RESET } },
    ],
    [
      'no data, core limit used up',
      { ...none, error: limited },
      { kind: 'rate-limited', resetAt: RESET },
    ],
    [
      'no data, network error',
      { ...none, error: network },
      { kind: 'error', error: network },
    ],
    ['404', { ...none, error: notFound }, { kind: 'not-found' }],
    // GitHub says it's gone: data from an earlier search is out of date.
    [
      '404 over data from search',
      { ...none, repo, error: notFound },
      { kind: 'not-found' },
    ],
  ] as const)('%s', (_, input, expected) => {
    expect(resolveRepoDetailsView(input)).toEqual(expected);
  });
});

describe('resolveRepoDetailsView: with a saved snapshot (ADR-0020 table)', () => {
  const saved = { ...none, snapshot };

  it.each([
    [
      'loading: the snapshot at once, no notice',
      saved,
      { kind: 'repo', repo: savedRepo, notice: undefined },
    ],
    [
      'live data arrived: live data wins',
      { ...saved, repo },
      { kind: 'repo', repo, notice: undefined },
    ],
    [
      'offline: the snapshot with its "saved copy" notice',
      { ...saved, isPaused: true },
      { kind: 'repo', repo: savedRepo, notice: savedCopy },
    ],
    [
      'network error: the snapshot, not an error state',
      { ...saved, error: network },
      { kind: 'repo', repo: savedRepo, notice: savedCopy },
    ],
    [
      '404: the snapshot, marked gone from GitHub',
      { ...saved, error: notFound },
      { kind: 'repo', repo: savedRepo, notice: { kind: 'gone' } },
    ],
    [
      "other error: the snapshot with the error's notice",
      { ...saved, error: server },
      { kind: 'repo', repo: savedRepo, notice: { kind: 'refresh-failed' } },
    ],
    [
      'core limit used up: the snapshot with the limit notice',
      { ...saved, error: limited },
      {
        kind: 'repo',
        repo: savedRepo,
        notice: { kind: 'rate-limited', resetAt: RESET },
      },
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
  const saved = { ...profile, name: 'As saved' };
  const base = {
    profile: undefined,
    savedProfile: undefined,
    isSaved: false,
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
      'the saved profile while the live one is missing',
      { ...base, savedProfile: saved, isSaved: true, isPaused: true },
      { kind: 'profile', profile: saved },
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
    [
      'offline, saved without its owner',
      { ...base, isSaved: true, isPaused: true },
      { kind: 'not-saved' },
    ],
    ['loading', base, { kind: 'loading' }],
  ] as const)('%s', (_, input, expected) => {
    expect(resolveOwnerSection(input)).toEqual(expected);
  });
});
