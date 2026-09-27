/**
 * GitHub API access: the only place `fetch` is used (ADR-0008, ADR-0015).
 * Exports grow with their consumers, so the public API stays minimal
 * (ADR-0022).
 */
export { sizedAvatarUrl } from './github/avatarUrl';
export { useCoreBudgetLow } from './github/budget';
export { githubClient } from './github/client';
export {
  ApiRequestError,
  isRetryable,
  toApiError,
  type ApiError,
} from './github/errors';
export { useRateLimit } from './github/rateLimit';
