import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/**
 * Cached results that no screen is showing, and a way to clear them (the
 * persisted copy follows, ADR-0011). What's on screen stays: removing it
 * would only refetch it at once and spend rate limit (ADR-0012).
 */
export function useCachedResults(): { count: number; clear: () => void } {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();
  const count = useSyncExternalStore(
    onChange => cache.subscribe(onChange),
    () =>
      cache.findAll({
        type: 'inactive',
        predicate: query => query.state.data !== undefined,
      }).length,
  );
  return {
    count,
    clear: () => {
      queryClient.removeQueries({ type: 'inactive' });
    },
  };
}
