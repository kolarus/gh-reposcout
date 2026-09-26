import type { z } from 'zod';

import { appConfig } from '@/shared/config';
import { monitoring } from '@/shared/monitoring';

import { ApiRequestError, type ApiError } from './errors';
import { readRateLimitHeaders, toResource, useRateLimit } from './rateLimit';

type QueryValue = string | number | undefined;

interface RequestOptions {
  /** Cancels the request (TanStack Query passes one; ADR-0007). */
  signal?: AbortSignal | undefined;
  query?: Readonly<Record<string, QueryValue>>;
}

export interface GitHubClient {
  /** GET a path and validate the JSON body against `schema` (ADR-0008). */
  get: <T>(
    path: string,
    schema: z.ZodType<T>,
    options?: RequestOptions,
  ) => Promise<T>;
}

interface GitHubClientConfig {
  /** Injectable for tests and for a future proxy/auth wrapper. */
  fetch?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  now?: () => number;
}

/**
 * Query strings are encoded by hand rather than with URL/URLSearchParams:
 * React Native's URL is a simplified polyfill whose encoding can differ from
 * Node's (where tests run), so this keeps devices and tests identical.
 */
const toQueryString = (
  query: Readonly<Record<string, QueryValue>> = {},
): string => {
  const pairs = Object.entries(query)
    .filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined,
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
};

/**
 * Links the caller's signal with a timeout, and remembers which one fired:
 * a timeout is a `network` error, a caller abort isn't an error at all.
 */
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => {
    controller.abort();
  };
  if (signal?.aborted === true) controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onCallerAbort);
    },
  };
}

/** Maps a non-2xx response to an ApiError (classification table: ADR-0018). */
function classify(response: Response, body: unknown, now: number): ApiError {
  const { status, headers } = response;
  const retryAfter = headers.get('retry-after');
  const exhausted = headers.get('x-ratelimit-remaining') === '0';

  if (
    (status === 403 || status === 429) &&
    (exhausted || retryAfter !== null)
  ) {
    const reset = Number(headers.get('x-ratelimit-reset'));
    const resetAt =
      retryAfter !== null
        ? new Date(now + Number(retryAfter) * 1000)
        : Number.isFinite(reset) && reset > 0
          ? new Date(reset * 1000)
          : new Date(now + 60_000);
    return {
      kind: 'rate-limited',
      resource: toResource(headers.get('x-ratelimit-resource')),
      resetAt: resetAt.toISOString(),
    };
  }
  if (status === 404) return { kind: 'not-found' };
  if (status === 422) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Unprocessable request';
    return { kind: 'validation', message };
  }
  return { kind: 'http', status };
}

const readJson = async (response: Response): Promise<unknown> => {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return undefined;
  }
};

export function createGitHubClient(
  config: GitHubClientConfig = {},
): GitHubClient {
  const {
    fetch: injectedFetch,
    baseUrl = appConfig.github.apiUrl,
    timeoutMs = appConfig.github.requestTimeoutMs,
    now = Date.now,
  } = config;

  // The one place request headers are built; auth would slot in here (ADR-0012).
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': appConfig.github.apiVersion,
  };

  return {
    get: async (path, schema, options = {}) => {
      const guard = withTimeout(options.signal, timeoutMs);
      try {
        let response: Response;
        try {
          // Resolved per call, not at creation: wrappers installed later (e.g. a
          // test network or monitoring) must still see the request.
          const fetchImpl = injectedFetch ?? globalThis.fetch;
          response = await fetchImpl(
            `${baseUrl}${path}${toQueryString(options.query)}`,
            {
              headers,
              signal: guard.signal,
            },
          );
        } catch (error) {
          // The caller cancelled (e.g. a newer search): rethrow untouched so
          // TanStack Query treats it as a cancellation, not a failure.
          if (options.signal?.aborted === true && !guard.timedOut())
            throw error;
          throw new ApiRequestError({ kind: 'network' }, { cause: error });
        }

        const rateLimit = readRateLimitHeaders(response.headers);
        if (rateLimit !== undefined) {
          useRateLimit.getState().record(rateLimit.resource, rateLimit.state);
        }

        const body = await readJson(response);
        if (!response.ok)
          throw new ApiRequestError(classify(response, body, now()));

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          const error = new ApiRequestError(
            {
              kind: 'validation',
              message: `Unexpected response shape for ${path}`,
            },
            { cause: parsed.error },
          );
          // A schema mismatch means GitHub changed or we're wrong: always report it.
          monitoring.captureException(error, {
            path,
            issues: parsed.error.issues.length,
          });
          throw error;
        }
        return parsed.data;
      } finally {
        guard.dispose();
      }
    },
  };
}
