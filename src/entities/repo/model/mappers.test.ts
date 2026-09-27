import { z } from 'zod';

import {
  buildRepoDto,
  capturedRepository,
  capturedSearchResponse,
} from '@/test/github';

import { toRepoDetails } from './mappers';
import { repoSchema } from '../api/repo.schema';

const parse = (value: unknown) => toRepoDetails(repoSchema.parse(value));

describe('repoSchema + toRepoDetails', () => {
  it('accepts every item of a real search response, complete for Details (contract)', () => {
    const { items } = z
      .object({ items: z.array(z.unknown()) })
      .parse(capturedSearchResponse);

    const repos = items.map(parse);

    expect(repos.length).toBeGreaterThan(0);
    for (const repo of repos) {
      expect(repo.fullName).toBe(`${repo.owner.login}/${repo.name}`);
      expect(repo.htmlUrl).toBe(`https://github.com/${repo.fullName}`);
      expect(repo.defaultBranch).not.toBe('');
      expect(Number.isNaN(Date.parse(repo.createdAt))).toBe(false);
    }
  });

  it('accepts a real GET /repos/{owner}/{name} response the same way (contract)', () => {
    expect(parse(capturedRepository)).toMatchObject({
      fullName: 'react/react-native',
      owner: { login: 'react', kind: 'organization' },
      homepageUrl: 'https://reactnative.dev',
      license: 'MIT',
      defaultBranch: 'main',
      archived: false,
    });
  });

  it('maps to camelCase and keeps only the fields the app uses', () => {
    expect(
      parse(
        buildRepoDto(7, {
          owner: {
            login: 'acme',
            avatar_url: 'https://a.test/u/1?v=4',
            type: 'User',
          },
          description: 'A thing',
          html_url: 'https://github.com/acme/repo-7',
          homepage: 'acme.dev',
          stargazers_count: 1234,
          forks_count: 56,
          open_issues_count: 7,
          language: 'TypeScript',
          license: { name: 'Apache License 2.0', spdx_id: 'Apache-2.0' },
          topics: ['cli'],
          default_branch: 'main',
          size: 2048,
          archived: true,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2026-09-01T10:00:00Z',
          pushed_at: '2026-08-31T10:00:00Z',
        }),
      ),
    ).toEqual({
      id: 7,
      owner: {
        login: 'acme',
        avatarUrl: 'https://a.test/u/1?v=4',
        kind: 'user',
      },
      name: 'repo-7',
      fullName: 'owner-7/repo-7',
      description: 'A thing',
      htmlUrl: 'https://github.com/acme/repo-7',
      homepageUrl: 'https://acme.dev',
      stars: 1234,
      forks: 56,
      openIssues: 7,
      language: 'TypeScript',
      license: 'Apache-2.0',
      topics: ['cli'],
      defaultBranch: 'main',
      sizeKb: 2048,
      archived: true,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      pushedAt: '2026-08-31T10:00:00Z',
    });
  });

  it('turns null or blank text into undefined', () => {
    const repo = parse(
      buildRepoDto(1, {
        description: '   ',
        language: null,
        license: null,
        homepage: '',
        pushed_at: null,
      }),
    );
    expect(repo.description).toBeUndefined();
    expect(repo.language).toBeUndefined();
    expect(repo.license).toBeUndefined();
    expect(repo.homepageUrl).toBeUndefined();
    expect(repo.pushedAt).toBeUndefined();
  });

  it('names custom licenses instead of showing NOASSERTION', () => {
    const repo = parse(
      buildRepoDto(1, { license: { name: 'Other', spdx_id: 'NOASSERTION' } }),
    );
    expect(repo.license).toBe('Other');
  });

  it('drops a homepage that is not https', () => {
    expect(
      parse(buildRepoDto(1, { homepage: 'http://insecure.test' })).homepageUrl,
    ).toBeUndefined();
    expect(
      parse(buildRepoDto(1, { homepage: 'javascript:alert(1)' })).homepageUrl,
    ).toBeUndefined();
  });

  it('rejects a response missing a field the app needs', () => {
    expect(() =>
      repoSchema.parse(buildRepoDto(1, { default_branch: undefined })),
    ).toThrow();
  });
});
