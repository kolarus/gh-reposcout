declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Kept on the device between launches, for offline use (ADR-0011). */
      persist?: boolean;
    };
  }
}

/**
 * Opts a query into the persisted cache (ADR-0011): `meta: persistedQueryMeta`.
 * Everything else stays in memory only. Each slice decides for its own
 * queries, so a new query is never written to storage by accident.
 */
export const persistedQueryMeta = { persist: true } as const;
