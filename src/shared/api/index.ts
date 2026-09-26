/**
 * GitHub API access: the only place `fetch` is used (ADR-0008, ADR-0015).
 * Exports grow with their consumers (the client instance arrives with the first
 * endpoint in Phase 2), so the public API stays minimal (ADR-0022).
 */
export { ApiRequestError, isRetryable } from './github/errors';
