import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import type {
  PersistedClient,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';

import { APP_VERSION, appConfig } from '@/shared/config';
import { queryCacheStorage } from '@/shared/storage';

type PersistedQuery = PersistedClient['clientState']['queries'][number];

const isInfiniteData = (
  data: unknown,
): data is { pages: unknown[]; pageParams: unknown[] } =>
  typeof data === 'object' &&
  data !== null &&
  'pages' in data &&
  Array.isArray(data.pages) &&
  'pageParams' in data &&
  Array.isArray(data.pageParams);

const firstPageOnly = (query: PersistedQuery): PersistedQuery => {
  const { data } = query.state;
  if (!isInfiniteData(data)) return query;
  return {
    ...query,
    state: {
      ...query.state,
      data: {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      },
    },
  };
};

/**
 * Bounds what's written (ADR-0011): the newest `maxPerGroup` entries of each
 * key group (`search`, `repo`, `owner`), and only the first page of an
 * infinite query. One page also keeps a restored search refreshable: with
 * more, it would never go stale (see `searchQueryOptions`).
 */
export function trimPersistedClient(
  client: PersistedClient,
  maxPerGroup: number,
): PersistedClient {
  const newestFirst = [...client.clientState.queries].sort(
    (a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt,
  );
  const perGroup = new Map<unknown, number>();
  const queries: PersistedQuery[] = [];
  for (const query of newestFirst) {
    const group = query.queryKey[0];
    const count = perGroup.get(group) ?? 0;
    if (count < maxPerGroup) {
      perGroup.set(group, count + 1);
      queries.push(firstPageOnly(query));
    }
  }
  return { ...client, clientState: { ...client.clientState, queries } };
}

/**
 * Persists the query cache to its MMKV instance (ADR-0011). The async
 * persister accepts synchronous storage; the sync one is deprecated. Writes
 * are throttled to one a second.
 */
const persister = createAsyncStoragePersister({
  storage: {
    getItem: key => queryCacheStorage.getString(key),
    setItem: (key, value) => {
      queryCacheStorage.set(key, value);
    },
    removeItem: key => {
      queryCacheStorage.remove(key);
    },
  },
  key: 'query-cache',
  serialize: client =>
    JSON.stringify(
      trimPersistedClient(client, appConfig.query.persistMaxPerGroup),
    ),
});

/**
 * What `PersistQueryClientProvider` restores and writes (ADR-0011): queries
 * that opted in with `persistedQueryMeta` and succeeded, dropped after 24 h
 * or when the app version changes (the cached shapes may have changed).
 */
export const queryPersistOptions: Omit<
  PersistQueryClientOptions,
  'queryClient'
> = {
  persister,
  maxAge: appConfig.query.persistMaxAgeMs,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: query =>
      defaultShouldDehydrateQuery(query) && query.meta?.persist === true,
  },
};
