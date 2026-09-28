import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';

import { monitoring } from '@/shared/monitoring';
import { server } from '@/test/server';

import { createGitHubClient } from './client';
import { ApiRequestError, toApiError, type ApiError } from './errors';
import { useRateLimit } from './rateLimit';

const BASE = 'https://api.test';
const NOW = Date.parse('2026-09-26T12:00:00Z');
const client = createGitHubClient({
  baseUrl: BASE,
  timeoutMs: 200,
  now: () => NOW,
});
const repoSchema = z.object({ id: z.number(), name: z.string() });

const detailOf = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiRequestError);
    return toApiError(error);
  }
  throw new Error('expected the request to fail');
};

beforeEach(() => {
  useRateLimit.setState({ buckets: {} });
});

describe('createGitHubClient', () => {
  it('sends GitHub headers and encoded query params, and returns validated data', async () => {
    let seen: Request | undefined;
    server.use(
      http.get(`${BASE}/search/repositories`, ({ request }) => {
        seen = request;
        return HttpResponse.json({
          id: 1,
          name: 'react-native',
          extra: 'ignored',
        });
      }),
    );

    const data = await client.get('/search/repositories', repoSchema, {
      query: { q: 'react native language:ts', page: 2, sort: undefined },
    });

    expect(data).toEqual({ id: 1, name: 'react-native' });
    expect(seen?.headers.get('accept')).toBe('application/vnd.github+json');
    expect(seen?.headers.get('x-github-api-version')).toBe('2022-11-28');
    const url = new URL(seen?.url ?? '');
    expect(url.searchParams.get('q')).toBe('react native language:ts');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.has('sort')).toBe(false);
  });

  it('records the rate-limit budget per bucket', async () => {
    server.use(
      http.get(`${BASE}/search/repositories`, () =>
        HttpResponse.json(
          { id: 1, name: 'x' },
          {
            headers: {
              'x-ratelimit-resource': 'search',
              'x-ratelimit-limit': '10',
              'x-ratelimit-remaining': '7',
              'x-ratelimit-reset': '1790000000',
            },
          },
        ),
      ),
    );

    await client.get('/search/repositories', repoSchema);

    expect(useRateLimit.getState().buckets).toEqual({
      search: {
        limit: 10,
        remaining: 7,
        resetAt: new Date(1790000000 * 1000).toISOString(),
      },
    });
  });

  it.each([
    [
      'primary rate limit (403, remaining 0)',
      {
        status: 403,
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1790000000',
          'x-ratelimit-resource': 'search',
        },
      },
      {
        kind: 'rate-limited',
        resource: 'search',
        resetAt: new Date(1790000000 * 1000).toISOString(),
      },
    ],
    [
      'secondary rate limit (429, retry-after)',
      {
        status: 429,
        headers: { 'retry-after': '30', 'x-ratelimit-resource': 'core' },
      },
      {
        kind: 'rate-limited',
        resource: 'core',
        resetAt: new Date(NOW + 30_000).toISOString(),
      },
    ],
    ['not found', { status: 404, headers: {} }, { kind: 'not-found' }],
    [
      'plain 403 (not a rate limit)',
      { status: 403, headers: {} },
      { kind: 'http', status: 403 },
    ],
    [
      'server error',
      { status: 502, headers: {} },
      { kind: 'http', status: 502 },
    ],
  ] as const)('classifies %s', async (_name, init, expected) => {
    server.use(
      http.get(`${BASE}/repos/a/b`, () =>
        HttpResponse.json(
          { message: 'nope' },
          { status: init.status, headers: init.headers },
        ),
      ),
    );

    expect(await detailOf(client.get('/repos/a/b', repoSchema))).toEqual(
      expected,
    );
  });

  it('treats a secondary rate limit without headers as one: a minute, in the request’s bucket', async () => {
    server.use(
      http.get(`${BASE}/search/repositories`, () =>
        HttpResponse.json(
          {
            message:
              'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
          },
          { status: 403 },
        ),
      ),
    );

    expect(
      await detailOf(client.get('/search/repositories', repoSchema)),
    ).toEqual({
      kind: 'rate-limited',
      resource: 'search',
      resetAt: new Date(NOW + 60_000).toISOString(),
    });
  });

  it('reports an invalid search query (422) as validation with GitHub’s message', async () => {
    server.use(
      http.get(`${BASE}/search/repositories`, () =>
        HttpResponse.json({ message: 'Validation Failed' }, { status: 422 }),
      ),
    );

    expect(
      await detailOf(client.get('/search/repositories', repoSchema)),
    ).toEqual({
      kind: 'validation',
      message: 'Validation Failed',
    });
  });

  it('reports an unexpected response shape as validation', async () => {
    server.use(
      http.get(`${BASE}/repos/a/b`, () =>
        HttpResponse.json({ id: 'not-a-number' }),
      ),
    );
    const capture = jest
      .spyOn(monitoring, 'captureException')
      .mockImplementation(() => undefined);

    expect(await detailOf(client.get('/repos/a/b', repoSchema))).toMatchObject({
      kind: 'validation',
    });
    // A schema mismatch means GitHub changed or we're wrong: always reported.
    expect(capture).toHaveBeenCalledTimes(1);
    capture.mockRestore();
  });

  it('reports a failed connection as network', async () => {
    server.use(http.get(`${BASE}/repos/a/b`, () => HttpResponse.error()));

    expect(await detailOf(client.get('/repos/a/b', repoSchema))).toEqual({
      kind: 'network',
    });
  });

  it('reports a timeout as network', async () => {
    server.use(
      http.get(`${BASE}/repos/a/b`, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    expect(await detailOf(client.get('/repos/a/b', repoSchema))).toEqual({
      kind: 'network',
    });
  });

  it('rethrows a caller cancellation untouched (not an ApiError)', async () => {
    server.use(
      http.get(`${BASE}/repos/a/b`, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();

    const request = client.get('/repos/a/b', repoSchema, {
      signal: controller.signal,
    });
    controller.abort();

    await expect(request).rejects.not.toBeInstanceOf(ApiRequestError);
  });
});
