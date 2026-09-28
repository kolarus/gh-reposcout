import { QueryObserver } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react-native';

import { createTestQueryClient } from '@/test/TestProviders';

import { limitCachedSearches } from './searchCacheLimit';
import { searchKeys } from './searchKeys';

const keyOf = (query: string) => searchKeys.list({ query, sort: 'best-match' });

/** Seeds a search as loaded at `updatedAt`, observed by nothing. */
function seedSearch(
  client: ReturnType<typeof createTestQueryClient>,
  query: string,
  updatedAt: number,
) {
  client.setQueryData(
    keyOf(query),
    { pages: [], pageParams: [] },
    { updatedAt },
  );
}

/** Which of these searches are still in the cache. */
const cached = (
  client: ReturnType<typeof createTestQueryClient>,
  queries: readonly string[],
) =>
  queries.filter(
    query =>
      client.getQueryCache().find({ queryKey: keyOf(query), exact: true }) !==
      undefined,
  );

describe('limitCachedSearches', () => {
  it('keeps the five most recently loaded searches, and leaves other queries alone', async () => {
    const client = createTestQueryClient();
    const stop = limitCachedSearches(client);
    client.setQueryData(['repo', 'detail', 'a/b'], { id: 1 });

    for (const [index, query] of [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
    ].entries()) {
      seedSearch(client, query, 1000 + index);
    }

    await waitFor(() => {
      expect(cached(client, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual([
        'c',
        'd',
        'e',
        'f',
        'g',
      ]);
    });
    expect(client.getQueryData(['repo', 'detail', 'a/b'])).toEqual({ id: 1 });
    stop();
  });

  it('never evicts a search that is on screen, however old', async () => {
    const client = createTestQueryClient();
    const stop = limitCachedSearches(client);
    seedSearch(client, 'shown', 1);
    const observer = new QueryObserver(client, {
      queryKey: keyOf('shown'),
      enabled: false,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    for (const [index, query] of ['a', 'b', 'c', 'd', 'e', 'f'].entries()) {
      seedSearch(client, query, 1000 + index);
    }

    await waitFor(() => {
      expect(cached(client, ['shown', 'a', 'b', 'c', 'd', 'e', 'f'])).toEqual([
        'shown',
        'b',
        'c',
        'd',
        'e',
        'f',
      ]);
    });
    unsubscribe();
    stop();
  });
});
