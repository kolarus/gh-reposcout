import { secondsUntil, useNow } from '@/shared/lib';

import { useRateLimit } from './rateLimit';

/**
 * Core requests kept back for ones a screen can't do without, such as a deep
 * link's repository (ADR-0012). At or below this, optional requests (owner
 * profiles, snapshot completion) wait for the reset.
 */
export const CORE_RESERVE = 5;

type Bucket = ReturnType<typeof useRateLimit.getState>['buckets']['core'];

const lowUntil = (core: Bucket, now: number): string | undefined => {
  if (core === undefined || core.remaining > CORE_RESERVE) return undefined;
  return secondsUntil(core.resetAt, now) > 0 ? core.resetAt : undefined;
};

/**
 * When the core budget is at the reserve, the time it resets (ISO date), so
 * optional requests can wait for it; otherwise `undefined`. An unknown budget
 * (no request made yet) isn't low.
 */
export function useCoreBudgetLow(): string | undefined {
  const core = useRateLimit(state => state.buckets.core);
  // Re-evaluated every 30 s, so optional requests resume soon after the reset.
  const now = useNow(30_000);
  return lowUntil(core, now);
}

/** The same check outside React, e.g. before a background request. */
export const isCoreBudgetLow = (): boolean =>
  lowUntil(useRateLimit.getState().buckets.core, Date.now()) !== undefined;
