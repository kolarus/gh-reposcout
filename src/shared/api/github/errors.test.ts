import { ApiRequestError, isRetryable, toApiError } from './errors';

describe('toApiError', () => {
  it('unwraps ApiRequestError and wraps anything else as unexpected', () => {
    expect(toApiError(new ApiRequestError({ kind: 'not-found' }))).toEqual({
      kind: 'not-found',
    });
    const cause = new Error('boom');
    expect(toApiError(cause)).toEqual({ kind: 'unexpected', cause });
  });
});

describe('isRetryable', () => {
  it.each([
    [{ kind: 'network' } as const, true],
    [{ kind: 'http', status: 503 } as const, true],
    [{ kind: 'http', status: 400 } as const, false],
    [{ kind: 'not-found' } as const, false],
    [{ kind: 'validation', message: 'x' } as const, false],
    [
      {
        kind: 'rate-limited',
        resource: 'search',
        resetAt: '2026-01-01T00:00:00Z',
      } as const,
      false,
    ],
  ])('%o → %s', (detail, expected) => {
    expect(isRetryable(new ApiRequestError(detail))).toBe(expected);
  });

  it('never retries unknown errors', () => {
    expect(isRetryable(new Error('boom'))).toBe(false);
  });
});
