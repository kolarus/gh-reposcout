import { repoSchema, toRepoDetails, type RepoDetails } from '@/entities/repo';
import { buildRepoDto } from '@/test/github';

import {
  getNextSearchPage,
  reachedResultCap,
  toSearchResults,
  type SearchPage,
} from './searchResults';

// A real repo record (from the captured search response) with a unique id.
const repo = (id: number): RepoDetails =>
  toRepoDetails(repoSchema.parse(buildRepoDto(id)));

const page = (
  firstId: number,
  count: number,
  totalCount: number,
  incompleteResults = false,
): SearchPage => ({
  totalCount,
  incompleteResults,
  items: Array.from({ length: count }, (_, i) => repo(firstId + i)),
});

describe('getNextSearchPage', () => {
  it('asks for the next page while full pages keep coming', () => {
    expect(getNextSearchPage(page(1, 100, 5000), [], 1)).toBe(2);
    expect(getNextSearchPage(page(801, 100, 5000), [], 9)).toBe(10);
  });

  it("stops at GitHub's 1,000-result cap even when more match", () => {
    expect(getNextSearchPage(page(901, 100, 5000), [], 10)).toBeUndefined();
  });

  it('stops on a short page', () => {
    expect(getNextSearchPage(page(101, 50, 150), [], 2)).toBeUndefined();
  });

  it('stops when the total is reached exactly with a full page', () => {
    expect(getNextSearchPage(page(101, 100, 200), [], 2)).toBeUndefined();
  });

  it('stops on an empty first page', () => {
    expect(getNextSearchPage(page(1, 0, 0), [], 1)).toBeUndefined();
  });
});

describe('toSearchResults', () => {
  it('flattens pages in order and drops repeats from shifting rankings', () => {
    const results = toSearchResults({
      pages: [page(1, 3, 10), { ...page(3, 3, 10) }],
    });
    expect(results.repos.map(r => r.id)).toEqual([1, 2, 3, 4, 5]);
    expect(results.totalCount).toBe(10);
  });

  it('flags the results incomplete if any page was', () => {
    expect(
      toSearchResults({ pages: [page(1, 1, 2), page(2, 1, 2, true)] })
        .incompleteResults,
    ).toBe(true);
  });

  it('handles no pages', () => {
    expect(toSearchResults({ pages: [] })).toEqual({
      repos: [],
      totalCount: 0,
      incompleteResults: false,
    });
  });
});

describe('reachedResultCap', () => {
  it('is true only when the list ended at the cap, not at the real end', () => {
    const capped = toSearchResults({
      pages: Array.from({ length: 10 }, (_, i) => page(i * 100 + 1, 100, 5000)),
    });
    expect(reachedResultCap(capped)).toBe(true);
    expect(
      reachedResultCap(toSearchResults({ pages: [page(1, 40, 40)] })),
    ).toBe(false);
  });
});
