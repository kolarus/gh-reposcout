import { onlineManager } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { delay, http, HttpResponse } from 'msw';

import { useRateLimit } from '@/shared/api';
import { createGate } from '@/test/gate';
import { buildRepoDto, buildSearchPage, SEARCH_URL } from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, createWrapper } from '@/test/TestProviders';

import { useRepoSearch } from './useRepoSearch';
import type { SearchSort } from '../model/searchParams';
import { useRecentSearches } from '../store/recentSearches';

interface Props {
  text: string;
  sort: SearchSort;
}

const IDLE: Props = { text: '', sort: 'best-match' };

async function setup() {
  const queryClient = createTestQueryClient();
  const hook = await renderHook(
    (props: Props) => useRepoSearch(props.text, props.sort),
    { initialProps: IDLE, wrapper: createWrapper(queryClient) },
  );

  /** Types `text` and presses the keyboard's search key (no debounce). */
  const searchNow = async (text: string, sort: SearchSort = 'best-match') => {
    await hook.rerender({ text, sort });
    await act(() => {
      hook.result.current.submit(text);
    });
  };
  const waitForResults = () =>
    waitFor(() => {
      expect(hook.result.current.view.kind).toBe('results');
    });
  const repoIds = () => {
    const { view } = hook.result.current;
    return view.kind === 'results' ? view.results.repos.map(r => r.id) : [];
  };

  return { ...hook, queryClient, searchNow, waitForResults, repoIds };
}

/** Serves `total` results in pages of 100 and records every request. */
function serveSearch(total: number) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(SEARCH_URL, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      return HttpResponse.json(
        buildSearchPage({ page: Number(params.get('page')), total }),
      );
    }),
  );
  return requests;
}

/** GitHub's answer once the search budget is spent, until `resetEpoch` (s). */
const searchLimited = (resetEpoch: number) =>
  HttpResponse.json(
    {},
    {
      status: 403,
      headers: {
        'x-ratelimit-limit': '10',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(resetEpoch),
        'x-ratelimit-resource': 'search',
      },
    },
  );

beforeEach(() => {
  useRateLimit.setState({ buckets: {} });
  useRecentSearches.getState().clear();
});

afterEach(() => {
  onlineManager.setOnline(true);
  jest.useRealTimers();
});

describe('useRepoSearch', () => {
  it('stays idle below two characters, without calling GitHub', async () => {
    const requests = serveSearch(10);
    const { result, rerender } = await setup();

    await rerender({ text: ' r ', sort: 'best-match' });
    await act(() => {
      result.current.submit(' r ');
    });

    expect(result.current.view).toEqual({ kind: 'idle' });
    expect(requests).toHaveLength(0);
  });

  it('debounces typing: one request, for the text after the pause', async () => {
    jest.useFakeTimers();
    const requests = serveSearch(3);
    const { result, rerender, waitForResults } = await setup();

    for (const text of ['re', 'rea', 'react']) {
      await rerender({ text, sort: 'best-match' });
      await act(() => {
        jest.advanceTimersByTime(300);
      });
    }
    expect(requests).toHaveLength(0);
    // Pending from the first keystroke, before any request is sent.
    expect(result.current.isPending).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(100);
    });
    await waitForResults();

    expect(requests.map(p => p.get('q'))).toEqual(['react']);
    expect(result.current.isPending).toBe(false);
    expect(result.current.params).toEqual({
      query: 'react',
      sort: 'best-match',
    });
  });

  it('searches at once on submit, normalised, and remembers the query', async () => {
    const requests = serveSearch(3);
    const { searchNow, waitForResults, repoIds } = await setup();

    await searchNow('  React   Native ');
    await waitForResults();

    expect(requests.map(p => p.get('q'))).toEqual(['react native']);
    expect(repoIds()).toEqual([1, 2, 3]);
    expect(useRecentSearches.getState().queries).toEqual(['react native']);
  });

  it('cancels the request for a query that was replaced', async () => {
    const aborted: string[] = [];
    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? '';
        if (q === 'react') {
          request.signal.addEventListener('abort', () => aborted.push(q));
          await delay('infinite');
        }
        return HttpResponse.json(buildSearchPage({ page: 1, total: 2 }));
      }),
    );
    const { searchNow, waitForResults } = await setup();

    await searchNow('react');
    await searchNow('vue');
    await waitForResults();

    expect(aborted).toEqual(['react']);
  });

  it('loads further pages on demand and stops on a short page', async () => {
    const requests = serveSearch(150);
    const { result, searchNow, waitForResults, repoIds } = await setup();

    await searchNow('react');
    await waitForResults();
    expect(result.current.hasNextPage).toBe(true);

    await act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(repoIds()).toHaveLength(150);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(requests.map(p => p.get('page'))).toEqual(['1', '2']);
  });

  it("stops at GitHub's 1,000-result cap", async () => {
    const requests = serveSearch(5000);
    const { result, searchNow, waitForResults, repoIds } = await setup();

    await searchNow('react');
    await waitForResults();
    for (let page = 2; page <= 10; page += 1) {
      await act(() => {
        result.current.loadMore();
      });
      await waitFor(() => {
        expect(repoIds()).toHaveLength(page * 100);
      });
    }
    await act(() => {
      result.current.loadMore();
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(requests).toHaveLength(10);
  });

  it('removes repos repeated across pages', async () => {
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        // Rankings shifted: page 2 starts with the last repo of page 1.
        const first = page === 1 ? 1 : 100;
        return HttpResponse.json({
          total_count: 300,
          incomplete_results: false,
          items: Array.from({ length: 100 }, (_, i) => buildRepoDto(first + i)),
        });
      }),
    );
    const { result, searchNow, waitForResults, repoIds } = await setup();

    await searchNow('react');
    await waitForResults();
    await act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(repoIds()).toHaveLength(199);
    });

    expect(new Set(repoIds()).size).toBe(199);
  });

  it('keeps the previous results, marked stale, while a new sort loads', async () => {
    const starsGate = createGate();
    const requests: URLSearchParams[] = [];
    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        if (params.get('sort') === 'stars') await starsGate.opened;
        return HttpResponse.json(buildSearchPage({ page: 1, total: 5 }));
      }),
    );
    const { result, rerender, searchNow, waitForResults } = await setup();
    await searchNow('react');
    await waitForResults();

    await rerender({ text: 'react', sort: 'stars' });

    expect(result.current.view).toMatchObject({
      kind: 'results',
      isStale: true,
    });
    expect(result.current.isPending).toBe(true);
    starsGate.open();
    await waitFor(() => {
      expect(result.current.view).toMatchObject({
        kind: 'results',
        isStale: false,
      });
    });
    expect(requests.map(p => p.get('sort'))).toEqual([null, 'stars']);
    expect(result.current.isPending).toBe(false);
  });

  it.each([
    ['network', () => HttpResponse.error(), { kind: 'network' }],
    [
      'validation (invalid query)',
      () =>
        HttpResponse.json({ message: 'Validation Failed' }, { status: 422 }),
      { kind: 'validation', message: 'Validation Failed' },
    ],
    [
      'http',
      () => HttpResponse.json({}, { status: 503 }),
      { kind: 'http', status: 503 },
    ],
    [
      'rate-limited',
      () =>
        HttpResponse.json(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: {
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': '1790000000',
              'x-ratelimit-resource': 'search',
            },
          },
        ),
      {
        kind: 'rate-limited',
        resource: 'search',
        resetAt: new Date(1790000000 * 1000).toISOString(),
      },
    ],
  ])('shows a %s error for a failed first page', async (_, respond, error) => {
    server.use(http.get(SEARCH_URL, respond));
    const { result, searchNow } = await setup();

    await searchNow('react');

    await waitFor(() => {
      expect(result.current.view).toEqual({ kind: 'error', error });
    });
  });

  it('shows the reset time when rate limited, and resumes by itself after it', async () => {
    jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
    const resetEpoch = Math.floor(Date.now() / 1000) + 30;
    let limited = true;
    const requests: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requests.push(request.url);
        if (limited) return searchLimited(resetEpoch);
        return HttpResponse.json(buildSearchPage({ page: 1, total: 4 }));
      }),
    );
    const { result, searchNow, waitForResults } = await setup();

    await searchNow('react');
    await waitFor(() => {
      expect(result.current.view.kind).toBe('error');
    });
    expect(result.current.rateLimitResetAt).toBe(
      new Date(resetEpoch * 1000).toISOString(),
    );

    // Nothing is retried while the limit lasts…
    limited = false;
    await act(() => {
      jest.advanceTimersByTime(29_000);
    });
    expect(requests).toHaveLength(1);

    // …and the search resumes on its own once it has passed.
    await act(() => {
      jest.advanceTimersByTime(3_000);
    });
    await waitForResults();
    expect(requests).toHaveLength(2);
  });

  it('keeps resuming "load more" when the first try after the reset is still limited', async () => {
    jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
    const resetEpoch = Math.floor(Date.now() / 1000) + 30;
    const pageTwo: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 2) {
          pageTwo.push(request.url);
          // This device's clock runs ahead of GitHub's: the first try after
          // the reset still lands in the old window, with the same reset time.
          if (pageTwo.length <= 2) return searchLimited(resetEpoch);
        }
        return HttpResponse.json(buildSearchPage({ page, total: 300 }));
      }),
    );
    const { result, searchNow, waitForResults, repoIds } = await setup();
    await searchNow('react');
    await waitForResults();
    await act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.nextPageError?.kind).toBe('rate-limited');
    });

    await act(() => {
      jest.advanceTimersByTime(32_000);
    });
    await waitFor(() => {
      expect(pageTwo).toHaveLength(2);
    });
    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });
    expect(result.current.nextPageError?.kind).toBe('rate-limited');

    // Still limited after the reset: it tries again a few seconds later, not
    // at once (a burst) and not never (a stalled list).
    await act(() => {
      jest.advanceTimersByTime(4_000);
    });
    expect(pageTwo).toHaveLength(2);
    await waitFor(
      () => {
        expect(repoIds()).toHaveLength(200);
      },
      { timeout: 5_000 },
    );
    expect(pageTwo).toHaveLength(3);
    expect(result.current.nextPageError).toBeUndefined();
  });

  it('keeps loaded results when "load more" fails, and retries that page', async () => {
    let failPageTwo = true;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (page === 2 && failPageTwo) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json(buildSearchPage({ page, total: 500 }));
      }),
    );
    const { result, searchNow, waitForResults, repoIds } = await setup();
    await searchNow('react');
    await waitForResults();

    await act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.nextPageError).toEqual({
        kind: 'http',
        status: 500,
      });
    });
    expect(result.current.view.kind).toBe('results');
    expect(repoIds()).toHaveLength(100);

    failPageTwo = false;
    await act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(repoIds()).toHaveLength(200);
    });
    expect(result.current.nextPageError).toBeUndefined();
  });

  it('pull-to-refresh with 5 pages loaded sends exactly one request, for page 1', async () => {
    const requests = serveSearch(5000);
    const { result, searchNow, waitForResults, repoIds } = await setup();
    await searchNow('react');
    await waitForResults();
    for (let page = 2; page <= 5; page += 1) {
      await act(() => {
        result.current.loadMore();
      });
      await waitFor(() => {
        expect(repoIds()).toHaveLength(page * 100);
      });
    }
    requests.length = 0;

    await act(() => result.current.refresh());

    expect(requests.map(p => p.get('page'))).toEqual(['1']);
    expect(repoIds()).toHaveLength(100);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('revisiting a stale search refetches one loaded page, but never several', async () => {
    jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
    const requests = serveSearch(5000);
    const { result, searchNow, waitForResults, repoIds } = await setup();

    await searchNow('react');
    await waitForResults();
    await act(() => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(repoIds()).toHaveLength(200);
    });
    await searchNow('vue');
    await waitFor(() => {
      expect(result.current.view).toMatchObject({ isStale: false });
    });
    expect(requests).toHaveLength(3);

    await act(() => {
      jest.advanceTimersByTime(6 * 60 * 1000);
    });

    // Two pages loaded: shown from the cache, not refetched (2 requests).
    await searchNow('react');
    await waitForResults();
    expect(repoIds()).toHaveLength(200);
    expect(requests).toHaveLength(3);

    // One page loaded: refreshed in the background (1 request).
    await searchNow('vue');
    await waitFor(() => {
      expect(requests).toHaveLength(4);
    });
  });

  it('waits while offline and continues when back online', async () => {
    const requests = serveSearch(3);
    const { result, searchNow, waitForResults } = await setup();
    onlineManager.setOnline(false);

    await searchNow('react');

    await waitFor(() => {
      expect(result.current.view).toEqual({ kind: 'offline' });
    });
    expect(requests).toHaveLength(0);

    await act(() => {
      onlineManager.setOnline(true);
    });
    await waitForResults();
  });
});
