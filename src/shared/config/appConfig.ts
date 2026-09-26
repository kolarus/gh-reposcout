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
  query: {
    /** How long unused server data stays cached; also the offline window (ADR-0011). */
    gcTimeMs: 24 * 60 * 60 * 1000,
    /** Retries for transient failures only: network and 5xx (ADR-0007). */
    maxRetries: 2,
  },
} as const;
