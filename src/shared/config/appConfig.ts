const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Static app configuration. Small, cheap-to-change tunables live here with their
 * reason; bigger decisions are ADRs (ADR-0001).
 */
export const appConfig = {
  github: {
    apiUrl: 'https://api.github.com',
    /** Pinned REST API version, so GitHub-side changes can't silently alter responses. */
    apiVersion: '2022-11-28',
    /** Give up on a request after this long; reported as a `network` error (ADR-0018). */
    requestTimeoutMs: 15_000,
  },
  about: {
    sourceCodeUrl: 'https://github.com/kolarus/gh-reposcout',
    decisionsUrl: 'https://github.com/kolarus/gh-reposcout/tree/main/docs/adr',
  },
  query: {
    /** How long unused server data stays cached; also the offline window (ADR-0011). */
    gcTimeMs: DAY_MS,
    /** Retries for transient failures only: network and 5xx (ADR-0007). */
    maxRetries: 2,
    /**
     * The persisted cache (ADR-0011) is dropped when older than this. Never
     * above `gcTimeMs`, or restored entries would be collected at once.
     */
    persistMaxAgeMs: DAY_MS,
    /**
     * Newest entries persisted per key group (search, repo, owner). A search
     * page is ~65 KB (100 repos), so the cache stays around 350 KB at most.
     */
    persistMaxPerGroup: 5,
  },
} as const;
