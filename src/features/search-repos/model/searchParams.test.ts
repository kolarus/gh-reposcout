import { normalizeQuery, toApiSort, toSearchParams } from './searchParams';

describe('normalizeQuery', () => {
  it.each([
    ['  React   Native ', 'react native'],
    ['react\tnative\n', 'react native'],
    // Qualifiers pass through; GitHub treats them case-insensitively too.
    ['Language:Go  stars:>100', 'language:go stars:>100'],
  ])('%j → %j', (raw, expected) => {
    expect(normalizeQuery(raw)).toBe(expected);
  });
});

describe('toSearchParams', () => {
  it('is idle below two characters, counting after normalisation', () => {
    expect(toSearchParams('', 'best-match')).toBeUndefined();
    expect(toSearchParams(' r   ', 'best-match')).toBeUndefined();
    expect(toSearchParams('rn', 'stars')).toEqual({
      query: 'rn',
      sort: 'stars',
    });
  });
});

describe('toApiSort', () => {
  it.each([
    ['best-match', { sort: undefined, order: undefined }],
    ['stars', { sort: 'stars', order: 'desc' }],
    ['updated', { sort: 'updated', order: 'desc' }],
  ] as const)('%s → %j', (sort, expected) => {
    expect(toApiSort(sort)).toEqual(expected);
  });
});
