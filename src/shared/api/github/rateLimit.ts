import { create } from 'zustand';

import type { RateLimitResource } from './errors';

export interface RateLimitState {
  limit: number;
  remaining: number;
  /** ISO date when the budget refills. */
  resetAt: string;
}

interface RateLimitStore {
  buckets: Partial<Record<RateLimitResource, RateLimitState>>;
  record: (resource: RateLimitResource, state: RateLimitState) => void;
}

/**
 * Latest known budget per bucket, from response headers (ADR-0012). Search and
 * core are tracked separately: exhausting one must never block the other.
 */
export const useRateLimit = create<RateLimitStore>()(set => ({
  buckets: {},
  record: (resource, state) => {
    set(current => ({ buckets: { ...current.buckets, [resource]: state } }));
  },
}));

/** `search` is its own bucket; every other REST resource counts as `core`. */
export const toResource = (header: string | null): RateLimitResource =>
  header === 'search' ? 'search' : 'core';

/** Parses GitHub's `x-ratelimit-*` headers; `undefined` when they're absent. */
export function readRateLimitHeaders(
  headers: Headers,
): { resource: RateLimitResource; state: RateLimitState } | undefined {
  const limit = Number(headers.get('x-ratelimit-limit'));
  const remaining = Number(headers.get('x-ratelimit-remaining'));
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (
    ![limit, remaining, reset].every(Number.isFinite) ||
    headers.get('x-ratelimit-reset') === null
  ) {
    return undefined;
  }
  return {
    resource: toResource(headers.get('x-ratelimit-resource')),
    state: { limit, remaining, resetAt: new Date(reset * 1000).toISOString() },
  };
}
