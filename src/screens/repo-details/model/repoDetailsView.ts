import type { OwnerProfile, OwnerSection } from '@/entities/owner';
import type { RepoDetails } from '@/entities/repo';
import type { SavedRepoSnapshot } from '@/features/save-repo';
import type { ApiError } from '@/shared/api';

/** A strip above the repo when what's shown isn't fresh from GitHub. */
export type RepoNotice =
  | { kind: 'rate-limited'; resetAt: string }
  | { kind: 'refresh-failed' }
  /** The saved snapshot stands in: offline, or GitHub couldn't be reached. */
  | { kind: 'saved-copy'; refreshedAt: string }
  /** GitHub says the repo is gone; the saved snapshot is all that's left. */
  | { kind: 'gone' };

/** What Details shows. The screen switches over `kind` exhaustively. */
export type RepoDetailsView =
  | { kind: 'loading' }
  | { kind: 'repo'; repo: RepoDetails; notice: RepoNotice | undefined }
  | { kind: 'not-found' }
  | { kind: 'offline' }
  | { kind: 'rate-limited'; resetAt: string }
  | { kind: 'error'; error: ApiError };

/**
 * One decision, in priority order (ADR-0020's table):
 * 1. GitHub says the repo is gone: the saved snapshot with a notice, or "not
 *    found". Data copied from an earlier search is out of date by then.
 * 2. Data in the cache (live, or copied from search) is shown; a failed
 *    refresh only adds a notice.
 * 3. Otherwise the saved snapshot stands in: silently while the live data
 *    loads, with a "saved copy" notice offline or when GitHub can't be
 *    reached, and with the error's notice for anything else.
 * 4. Without either: rate limit, then other errors, then offline, then
 *    loading.
 */
export function resolveRepoDetailsView({
  repo,
  snapshot,
  error,
  isPaused,
}: {
  repo: RepoDetails | undefined;
  snapshot: SavedRepoSnapshot | undefined;
  error: ApiError | undefined;
  isPaused: boolean;
}): RepoDetailsView {
  if (error?.kind === 'not-found') {
    return snapshot === undefined
      ? { kind: 'not-found' }
      : { kind: 'repo', repo: snapshot.repo, notice: { kind: 'gone' } };
  }
  if (repo !== undefined) {
    return { kind: 'repo', repo, notice: noticeFor(error) };
  }
  if (snapshot !== undefined) {
    const savedCopy = {
      kind: 'saved-copy',
      refreshedAt: snapshot.refreshedAt,
    } as const;
    const notice =
      isPaused || error?.kind === 'network' ? savedCopy : noticeFor(error);
    return { kind: 'repo', repo: snapshot.repo, notice };
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
 * The owner card's body: a loaded profile always wins, then a saved one; then
 * errors; then the core-budget reserve holding it back (ADR-0012), unless the
 * user asked; then offline (for a saved repo: "not saved"); then loading.
 */
export function resolveOwnerSection({
  profile,
  savedProfile,
  isSaved,
  error,
  isPaused,
  heldBackUntil,
}: {
  profile: OwnerProfile | undefined;
  /** From the saved snapshot, if the repo is saved with its owner. */
  savedProfile: OwnerProfile | undefined;
  isSaved: boolean;
  error: ApiError | undefined;
  isPaused: boolean;
  /** Reset time while the reserve holds optional requests back. */
  heldBackUntil: string | undefined;
}): OwnerSection {
  const shown = profile ?? savedProfile;
  if (shown !== undefined) return { kind: 'profile', profile: shown };
  if (error?.kind === 'rate-limited') {
    return { kind: 'rate-limited', resetAt: error.resetAt };
  }
  if (error !== undefined) return { kind: 'error' };
  if (heldBackUntil !== undefined) {
    return { kind: 'paused', resetAt: heldBackUntil };
  }
  if (isPaused) return isSaved ? { kind: 'not-saved' } : { kind: 'offline' };
  return { kind: 'loading' };
}
