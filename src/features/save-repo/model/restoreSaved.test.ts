import { repoSchema, toRepoDetails } from '@/entities/repo';
import { buildRepoDto } from '@/test/github';

import { restoreSaved } from './restoreSaved';

// A snapshot as it sits in storage: JSON, with `undefined` written as `null`.
const stored = (id: number): unknown =>
  JSON.parse(
    JSON.stringify(
      {
        version: 1,
        savedAt: '2026-09-20T10:00:00Z',
        refreshedAt: '2026-09-20T10:00:00Z',
        repo: toRepoDetails(
          repoSchema.parse(buildRepoDto(id, { description: null })),
        ),
        owner: undefined,
      },
      (_key, value: unknown) => (value === undefined ? null : value),
    ),
  );

describe('restoreSaved', () => {
  it('restores valid snapshots in order, with undefined fields back', () => {
    const { saved, dropped } = restoreSaved({
      byId: { '1': stored(1), '2': stored(2) },
      order: [2, 1],
    });

    expect(dropped).toBe(0);
    expect(saved.order).toEqual([2, 1]);
    expect(saved.idByFullName).toEqual({
      'owner-1/repo-1': 1,
      'owner-2/repo-2': 2,
    });
    expect(saved.byId['1']?.repo.description).toBeUndefined();
    expect(saved.byId['1']?.owner).toBeUndefined();
  });

  it('drops only the entries that no longer validate', () => {
    const { saved, dropped } = restoreSaved({
      byId: {
        '1': stored(1),
        '2': { version: 1, repo: { id: 2 } },
        // Stored under the wrong id.
        '3': stored(4),
      },
      order: [1, 2, 3, 5],
    });

    expect(saved.order).toEqual([1]);
    expect(dropped).toBe(3);
  });

  it('starts empty from nothing, and from garbage', () => {
    expect(restoreSaved(undefined)).toEqual({
      saved: { byId: {}, order: [], idByFullName: {} },
      dropped: 0,
    });
    expect(restoreSaved('garbage').dropped).toBe(1);
  });
});
