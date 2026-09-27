import type { SearchResults } from './searchResults';
import { resolveSearchView } from './searchView';

const results = (count: number): SearchResults => ({
  repos: Array.from({ length: count }, (_, i) => ({
    id: i,
    owner: { login: 'o', avatarUrl: 'https://a.test/o' },
    name: `r${String(i)}`,
    fullName: `o/r${String(i)}`,
    description: undefined,
    stars: 0,
    language: undefined,
    updatedAt: '2026-01-01T00:00:00Z',
  })),
  totalCount: count,
  incompleteResults: false,
});

const base = {
  query: 'react',
  results: undefined,
  error: undefined,
  isPaused: false,
  isStale: false,
};

describe('resolveSearchView', () => {
  it('is idle without a query, whatever else is known', () => {
    expect(
      resolveSearchView({ ...base, query: undefined, results: results(3) }),
    ).toEqual({ kind: 'idle' });
  });

  it('shows the skeleton while the first page loads', () => {
    expect(resolveSearchView(base)).toEqual({ kind: 'loading' });
  });

  it('shows results, marked stale when they belong to the previous search', () => {
    expect(resolveSearchView({ ...base, results: results(2) })).toMatchObject({
      kind: 'results',
      isStale: false,
    });
    expect(
      resolveSearchView({ ...base, results: results(2), isStale: true }),
    ).toMatchObject({ kind: 'results', isStale: true });
  });

  it('is empty only when the current search found nothing', () => {
    expect(resolveSearchView({ ...base, results: results(0) })).toEqual({
      kind: 'empty',
      query: 'react',
    });
    // Zero stale results say nothing about the new query: skeleton, not
    // "0 repositories".
    expect(
      resolveSearchView({ ...base, results: results(0), isStale: true }),
    ).toEqual({ kind: 'loading' });
  });

  it('keeps data on screen over an error or being offline', () => {
    expect(
      resolveSearchView({
        ...base,
        results: results(1),
        error: { kind: 'network' },
        isPaused: true,
      }),
    ).toMatchObject({ kind: 'results' });
  });

  it('shows the error, then offline, when there is no data', () => {
    expect(
      resolveSearchView({
        ...base,
        error: { kind: 'network' },
        isPaused: true,
      }),
    ).toEqual({ kind: 'error', error: { kind: 'network' } });
    expect(resolveSearchView({ ...base, isPaused: true })).toEqual({
      kind: 'offline',
    });
  });
});
