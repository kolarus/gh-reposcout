import { QueryClient } from '@tanstack/react-query';

import { repoKeys } from './repoKeys';
import { seedRepoDetail } from './repoQuery';
import type { RepoDetails } from '../model/types';

const repo = (description: string): RepoDetails => ({
  id: 1,
  owner: { login: 'owner-1', avatarUrl: 'https://a.test/o', kind: 'user' },
  name: 'repo-1',
  fullName: 'owner-1/repo-1',
  description,
  htmlUrl: 'https://github.com/owner-1/repo-1',
  homepageUrl: undefined,
  stars: 1,
  forks: 0,
  openIssues: 0,
  language: undefined,
  license: undefined,
  topics: [],
  defaultBranch: 'main',
  sizeKb: 1,
  archived: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  pushedAt: undefined,
});
const key = repoKeys.detail({ owner: 'owner-1', name: 'repo-1' });

describe('seedRepoDetail', () => {
  it('stores the repo stamped with when the search ran', () => {
    const client = new QueryClient();

    seedRepoDetail(client, repo('from search'), 1000);

    expect(client.getQueryData(key)).toMatchObject({
      description: 'from search',
    });
    expect(client.getQueryState(key)?.dataUpdatedAt).toBe(1000);
  });

  it('never replaces newer data, e.g. a Details view loaded later', () => {
    const client = new QueryClient();
    client.setQueryData(key, repo('live'), { updatedAt: 5000 });

    seedRepoDetail(client, repo('older search'), 4000);

    expect(client.getQueryData(key)).toMatchObject({ description: 'live' });
  });

  it('shares one cache entry whatever the casing', () => {
    expect(repoKeys.detail({ owner: 'React', name: 'React-Native' })).toEqual(
      repoKeys.detail({ owner: 'react', name: 'react-native' }),
    );
  });
});
