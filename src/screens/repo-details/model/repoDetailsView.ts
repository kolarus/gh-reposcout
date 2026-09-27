import type { OwnerProfile, OwnerSection } from '@/entities/owner';
import type { RepoDetails } from '@/entities/repo';
import type { ApiError } from '@/shared/api';

/** A strip above the repo when a refresh didn't work but data is on screen. */
export type RepoNotice =
  { kind: 'rate-limited'; resetAt: string } | { kind: 'refresh-failed' };

/** What Details shows. The screen switches over `kind` exhaustively. */
export type RepoDetailsView =
  | { kind: 'loading' }
  | { kind: 'repo'; repo: RepoDetails; notice: RepoNotice | undefined }
  | { kind: 'not-found' }
  | { kind: 'offline' }
  | { kind: 'rate-limited'; resetAt: string }
  | { kind: 'error'; error: ApiError };

/**
 * One decision, in priority order (ADR-0020's table, before saved snapshots
 * join it in Phase 3b):
 * 1. GitHub says the repo is gone: "not found", even over data copied from an
 *    earlier search, which is now out of date.
 * 2. Any repo data (live, or copied from search) is shown; a failed refresh
 *    only adds a notice.
 * 3. Without data: rate limit, then other errors, then offline, then loading.
 */
export function resolveRepoDetailsView({
  repo,
  error,
  isPaused,
}: {
  repo: RepoDetails | undefined;
  error: ApiError | undefined;
  isPaused: boolean;
}): RepoDetailsView {
  if (error?.kind === 'not-found') return { kind: 'not-found' };
  if (repo !== undefined) {
    return { kind: 'repo', repo, notice: noticeFor(error) };
  }
  if (error?.kind === 'rate-limited') {
    return { kind: 'rate-limited', resetAt: error.resetAt };
  }
  if (error !== undefined) return { kind: 'error', error };
  if (isPaused) return { kind: 'offline' };
  return { kind: 'loading' };
}

const noticeFor = (error: ApiError | undefined): RepoNotice | undefined => {
  if (error === undefined) return undefined;
  if (error.kind === 'rate-limited') {
    return { kind: 'rate-limited', resetAt: error.resetAt };
  }
  return { kind: 'refresh-failed' };
};

/**
 * The owner card's body: a loaded profile always wins; then its errors; then
 * the core-budget reserve holding it back (ADR-0012), unless the user asked;
 * then offline; then loading.
 */
export function resolveOwnerSection({
  profile,
  error,
  isPaused,
  heldBackUntil,
}: {
  profile: OwnerProfile | undefined;
  error: ApiError | undefined;
  isPaused: boolean;
  /** Reset time while the reserve holds optional requests back. */
  heldBackUntil: string | undefined;
}): OwnerSection {
  if (profile !== undefined) return { kind: 'profile', profile };
  if (error?.kind === 'rate-limited') {
    return { kind: 'rate-limited', resetAt: error.resetAt };
  }
  if (error !== undefined) return { kind: 'error' };
  if (heldBackUntil !== undefined) {
    return { kind: 'paused', resetAt: heldBackUntil };
  }
  if (isPaused) return { kind: 'offline' };
  return { kind: 'loading' };
}
