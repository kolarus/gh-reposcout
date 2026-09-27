import { dehydrate, QueryClient, queryOptions } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

import { persistedQueryMeta } from '@/shared/api';

import { queryPersistOptions, trimPersistedClient } from './persistence';

const keyOf = (...parts: readonly unknown[]) =>
  queryOptions({ queryKey: parts }).queryKey;

const persistedFrom = (queryClient: QueryClient): PersistedClient => ({
  timestamp: Date.now(),
  buster: 'test',
  clientState: dehydrate(queryClient),
});

const keysOf = (client: PersistedClient) =>
  client.clientState.queries.map(query => query.queryKey);

describe('trimPersistedClient', () => {
  it('keeps the newest entries of each key group', () => {
    const queryClient = new QueryClient();
    for (let i = 1; i <= 12; i += 1) {
      queryClient.setQueryData(keyOf('search', i), 'page', { updatedAt: i });
    }
    queryClient.setQueryData(keyOf('repo', 'a'), 'repo', { updatedAt: 1 });
    queryClient.setQueryData(keyOf('owner', 'a'), 'owner', { updatedAt: 1 });

    const trimmed = trimPersistedClient(persistedFrom(queryClient), 10);

    const searches = keysOf(trimmed).filter(([group]) => group === 'search');
    expect(searches).toHaveLength(10);
    expect(searches).not.toContainEqual(['search', 1]);
    expect(searches).not.toContainEqual(['search', 2]);
    expect(keysOf(trimmed)).toContainEqual(['repo', 'a']);
    expect(keysOf(trimmed)).toContainEqual(['owner', 'a']);
  });

  it('keeps only the first page of an infinite query', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(keyOf('search', 'react'), {
      pages: ['page 1', 'page 2', 'page 3'],
      pageParams: [1, 2, 3],
    });
    queryClient.setQueryData(keyOf('repo', 'a'), { name: 'a' });

    const trimmed = trimPersistedClient(persistedFrom(queryClient), 10);

    const data = trimmed.clientState.queries.map(query => query.state.data);
    expect(data).toContainEqual({ pages: ['page 1'], pageParams: [1] });
    expect(data).toContainEqual({ name: 'a' });
  });
});

describe('queryPersistOptions', () => {
  it('persists only successful queries that opted in', async () => {
    const queryClient = new QueryClient();
    await queryClient.query(
      queryOptions({
        queryKey: ['opted-in'],
        queryFn: () => 'kept',
        meta: persistedQueryMeta,
      }),
    );
    await queryClient.query(
      queryOptions({ queryKey: ['memory-only'], queryFn: () => 'dropped' }),
    );
    await queryClient
      .query(
        queryOptions({
          queryKey: ['failed'],
          queryFn: () => Promise.reject(new Error('offline')),
          meta: persistedQueryMeta,
          retry: false,
        }),
      )
      .catch(() => undefined);

    const state = dehydrate(queryClient, queryPersistOptions.dehydrateOptions);

    expect(state.queries.map(query => query.queryKey)).toEqual([['opted-in']]);
  });
});
