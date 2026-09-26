import { ApiRequestError } from '@/shared/api';

import { createQueryClient } from './queryClient';

const retryOf = () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') throw new Error('expected a retry function');
  return retry;
};

describe('createQueryClient', () => {
  it('retries transient failures up to the limit', () => {
    const retry = retryOf();
    const network = new ApiRequestError({ kind: 'network' });

    expect(retry(0, network)).toBe(true);
    expect(retry(1, network)).toBe(true);
    expect(retry(2, network)).toBe(false);
  });

  it('never retries rate limits or client errors', () => {
    const retry = retryOf();

    expect(
      retry(
        0,
        new ApiRequestError({
          kind: 'rate-limited',
          resource: 'search',
          resetAt: '2026-01-01T00:00:00Z',
        }),
      ),
    ).toBe(false);
    expect(retry(0, new ApiRequestError({ kind: 'not-found' }))).toBe(false);
  });
});
