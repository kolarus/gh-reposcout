/** GitHub's separate rate-limit budgets (ADR-0012): search 10/min, core 60/h. */
export type RateLimitResource = 'search' | 'core';

/**
 * Every network failure becomes one of these kinds (ADR-0018). The UI switches
 * over `kind` exhaustively, so a new kind can't be forgotten.
 */
export type ApiError =
  | { kind: 'network' }
  | { kind: 'rate-limited'; resource: RateLimitResource; resetAt: string }
  | { kind: 'not-found' }
  | { kind: 'validation'; message: string }
  | { kind: 'http'; status: number }
  | { kind: 'unexpected'; cause: unknown };

const describe = (detail: ApiError): string => {
  switch (detail.kind) {
    case 'network':
      return 'Network request failed';
    case 'rate-limited':
      return `GitHub ${detail.resource} rate limit reached until ${detail.resetAt}`;
    case 'not-found':
      return 'Not found';
    case 'validation':
      return `Invalid request or response: ${detail.message}`;
    case 'http':
      return `HTTP ${String(detail.status)}`;
    case 'unexpected':
      return 'Unexpected error';
  }
};

/**
 * The thrown value: a real Error (stack traces, `cause`) carrying the typed
 * `detail` union that the UI narrows on.
 */
export class ApiRequestError extends Error {
  readonly detail: ApiError;

  constructor(detail: ApiError, options?: { cause?: unknown }) {
    super(describe(detail), options);
    this.name = 'ApiRequestError';
    this.detail = detail;
  }
}

/** Anything thrown → the ApiError union. */
export function toApiError(error: unknown): ApiError {
  return error instanceof ApiRequestError
    ? error.detail
    : { kind: 'unexpected', cause: error };
}

/** Only transient failures are retried: never rate limits or 4xx (ADR-0007). */
export function isRetryable(error: unknown): boolean {
  const detail = toApiError(error);
  return (
    detail.kind === 'network' ||
    (detail.kind === 'http' && detail.status >= 500)
  );
}
