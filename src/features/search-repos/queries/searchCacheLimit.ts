import type { QueryClient } from '@tanstack/react-query';

import { appConfig } from '@/shared/config';

import { searchKeys } from './searchKeys';

/**
 * Keeps at most this many searches in memory (ADR-0011): the same number the
 * device keeps for offline use, so both hold the same searches.
 */
const MAX_CACHED_SEARCHES = appConfig.query.persistMaxPerGroup;

/**
 * Evicts the least recently loaded searches that nothing shows any more,
 * beyond `MAX_CACHED_SEARCHES`. Unused data otherwise stays in memory for a
 * day (`gcTime`, which the offline copy needs), and a search scrolled to its
 * end holds 1,000 repos: memory grew by about 6 MB with each new one. An
 * evicted search loads again if the user goes back to it. Returns the
 * unsubscribe function.
 */
export function limitCachedSearches(queryClient: QueryClient): () => void {
  const cache = queryClient.getQueryCache();
  return cache.subscribe(event => {
    // A new search, or one the screen stopped showing: the moments the count
    // of unused searches can grow.
    if (event.type !== 'added' && event.type !== 'observerRemoved') return;
    // Evicting inside the cache's own notification would re-enter it.
    void Promise.resolve().then(() => {
      const newestFirst = cache
        .findAll({ queryKey: searchKeys.all })
        .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);
      for (const query of newestFirst.slice(MAX_CACHED_SEARCHES)) {
        if (query.getObserversCount() === 0) cache.remove(query);
      }
    });
  });
}
