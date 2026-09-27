import { z } from 'zod';

import { buildRepoDto, capturedSearchResponse } from '@/test/github';

import { toRepoSummary } from './mappers';
import { repoSummarySchema } from '../api/repo.schema';

const parse = (value: unknown) => toRepoSummary(repoSummarySchema.parse(value));

describe('repoSummarySchema + toRepoSummary', () => {
  it('accepts every item of a real GitHub search response (contract)', () => {
    const { items } = z
      .object({ items: z.array(z.unknown()) })
      .parse(capturedSearchResponse);

    const repos = items.map(parse);

    expect(repos.length).toBeGreaterThan(0);
    for (const repo of repos) {
      expect(repo.fullName).toBe(`${repo.owner.login}/${repo.name}`);
      expect(repo.owner.avatarUrl).toMatch(/^https:\/\//);
      expect(Number.isNaN(Date.parse(repo.updatedAt))).toBe(false);
    }
  });

  it('maps to camelCase and keeps only the fields the app uses', () => {
    expect(
      parse(
        buildRepoDto(7, {
          description: 'A thing',
          stargazers_count: 1234,
          language: 'TypeScript',
          updated_at: '2026-09-01T10:00:00Z',
          owner: { login: 'acme', avatar_url: 'https://a.test/u/1?v=4' },
        }),
      ),
    ).toEqual({
      id: 7,
      owner: { login: 'acme', avatarUrl: 'https://a.test/u/1?v=4' },
      name: 'repo-7',
      fullName: 'owner-7/repo-7',
      description: 'A thing',
      stars: 1234,
      language: 'TypeScript',
      updatedAt: '2026-09-01T10:00:00Z',
    });
  });

  it('turns null or blank text into undefined', () => {
    const repo = parse(buildRepoDto(1, { description: '   ', language: null }));
    expect(repo.description).toBeUndefined();
    expect(repo.language).toBeUndefined();
  });

  it('rejects a response missing a field the app needs', () => {
    expect(() =>
      repoSummarySchema.parse(buildRepoDto(1, { stargazers_count: undefined })),
    ).toThrow();
  });
});
