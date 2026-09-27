import { appStorage } from '@/shared/storage';

import { useRecentSearches } from './recentSearches';

const KEY = 'recent-searches';
const { add, remove, clear } = useRecentSearches.getState();

beforeEach(() => {
  clear();
});

describe('useRecentSearches', () => {
  it('keeps the newest first, normalised and without duplicates', () => {
    add('react');
    add('Expo');
    add('  REACT ');

    expect(useRecentSearches.getState().queries).toEqual(['react', 'expo']);
  });

  it('ignores queries too short to search', () => {
    add(' r ');
    expect(useRecentSearches.getState().queries).toEqual([]);
  });

  it('keeps at most 10', () => {
    for (let i = 0; i < 12; i += 1) add(`query ${String(i)}`);

    const { queries } = useRecentSearches.getState();
    expect(queries).toHaveLength(10);
    expect(queries[0]).toBe('query 11');
  });

  it('removes one query', () => {
    add('react');
    add('expo');
    remove('react');
    expect(useRecentSearches.getState().queries).toEqual(['expo']);
  });

  it('persists to MMKV', () => {
    add('flash list');
    expect(JSON.parse(appStorage.getString(KEY) ?? '{}')).toMatchObject({
      state: { queries: ['flash list'] },
    });
  });

  it('restores stored searches (as on the next launch)', async () => {
    appStorage.set(
      KEY,
      JSON.stringify({ state: { queries: ['flash list'] }, version: 1 }),
    );
    await useRecentSearches.persist.rehydrate();
    expect(useRecentSearches.getState().queries).toEqual(['flash list']);
  });

  it('drops corrupted storage instead of crashing', async () => {
    appStorage.set(
      KEY,
      JSON.stringify({ state: { queries: [1, null] }, version: 1 }),
    );
    await useRecentSearches.persist.rehydrate();
    expect(useRecentSearches.getState().queries).toEqual([]);
  });
});
