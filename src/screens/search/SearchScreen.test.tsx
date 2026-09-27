import {
  createStaticNavigation,
  type StaticScreenProps,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onlineManager } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { useRecentSearches } from '@/features/search-repos';
import { useRateLimit } from '@/shared/api';
import { Text } from '@/shared/ui';
import { createGate } from '@/test/gate';
import { buildSearchPage, SEARCH_URL } from '@/test/github';
import { server } from '@/test/server';
import { createTestQueryClient, TestProviders } from '@/test/TestProviders';

import { SearchScreen } from './SearchScreen';

function DetailsProbe({
  route,
}: StaticScreenProps<{ owner: string; name: string }>) {
  return <Text>{`details:${route.params.owner}/${route.params.name}`}</Text>;
}

const Navigation = createStaticNavigation(
  createNativeStackNavigator({
    screens: { Search: SearchScreen, RepoDetails: DetailsProbe },
  }),
);

async function renderScreen() {
  const queryClient = createTestQueryClient();
  await render(
    <TestProviders queryClient={queryClient}>
      <Navigation />
    </TestProviders>,
  );
  return queryClient;
}

/**
 * Serves `total` results and records the `q` of every request. With a `gate`,
 * responses wait until the test opens it.
 */
function serveSearch(
  total: number,
  { gate }: { gate?: ReturnType<typeof createGate> } = {},
) {
  const queries: string[] = [];
  server.use(
    http.get(SEARCH_URL, async ({ request }) => {
      const params = new URL(request.url).searchParams;
      queries.push(params.get('q') ?? '');
      await gate?.opened;
      return HttpResponse.json(
        buildSearchPage({ page: Number(params.get('page')), total }),
      );
    }),
  );
  return queries;
}

const typeQuery = async (text: string) => {
  await fireEvent.changeText(
    screen.getByLabelText('Search repositories'),
    text,
  );
};

// Fake timers: the debounce passes as the queries below wait, and whatever
// is still scheduled at the end (FlashList lays out in several passes) runs
// deliberately inside act() instead of after the test.
beforeEach(() => {
  jest.useFakeTimers();
  useRecentSearches.getState().clear();
  useRateLimit.setState({ buckets: {} });
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  // Unmount before going back online: otherwise a search paused by an
  // offline test resumes and renders after the test has finished.
  await cleanup();
  onlineManager.setOnline(true);
  jest.useRealTimers();
});

describe('SearchScreen', () => {
  it('goes from suggestions, through the skeleton, to result rows', async () => {
    const gate = createGate();
    serveSearch(3, { gate });
    await renderScreen();
    expect(
      screen.getByRole('header', { name: 'Try searching for' }),
    ).toBeOnTheScreen();

    await typeQuery('react');

    expect(await screen.findByTestId('search-skeleton')).toBeOnTheScreen();
    expect(screen.getByLabelText('Loading results')).toBeOnTheScreen();
    gate.open();
    expect(
      await screen.findByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: '3 repositories' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('End of results')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Most stars' }),
    ).toBeOnTheScreen();
  });

  it('opens a result in Details, handing it the result, and remembers the search', async () => {
    serveSearch(3);
    const queryClient = await renderScreen();
    await typeQuery('react');

    await fireEvent.press(
      await screen.findByRole('button', { name: /^owner-2\/repo-2,/ }),
    );

    expect(await screen.findByText('details:owner-2/repo-2')).toBeOnTheScreen();
    expect(useRecentSearches.getState().queries).toEqual(['react']);
    // Details finds the result in its cache, so it opens without a request
    // (ADR-0007, ADR-0012; covered end to end in the Details tests).
    const [cached] = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['repo'] });
    expect(cached?.state.data).toMatchObject({ fullName: 'owner-2/repo-2' });
  });

  it('runs a recent search when it is tapped', async () => {
    useRecentSearches.getState().add('flash list');
    const queries = serveSearch(2);
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'flash list' }));

    expect(
      await screen.findByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).toBeOnTheScreen();
    expect(queries).toEqual(['flash list']);
    expect(screen.getByLabelText('Search repositories')).toHaveDisplayValue(
      'flash list',
    );
  });

  it("veils the previous results while a new sort loads, and they can't be opened", async () => {
    const starsGate = createGate();
    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (params.get('sort') === 'stars') await starsGate.opened;
        return HttpResponse.json(
          buildSearchPage({ page: Number(params.get('page')), total: 3 }),
        );
      }),
    );
    await renderScreen();
    await typeQuery('react');
    await screen.findByRole('button', { name: /^owner-1\/repo-1,/ });

    await fireEvent.press(screen.getByRole('button', { name: 'Most stars' }));

    const staleRow = screen.getByRole('button', { name: /^owner-1\/repo-1,/ });
    expect(screen.getByTestId('stale-results')).toBeOnTheScreen();
    // The search field says it's loading, so the faded rows don't read as
    // the answer.
    expect(screen.getByLabelText('Loading results')).toBeOnTheScreen();
    expect(staleRow).toBeDisabled();
    await fireEvent.press(staleRow);
    expect(screen.queryByText(/^details:/)).not.toBeOnTheScreen();

    // Once the new results arrive, rows work again.
    starsGate.open();
    await waitFor(() => {
      expect(screen.queryByTestId('stale-results')).not.toBeOnTheScreen();
    });
    expect(
      screen.getByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).toBeEnabled();
    expect(screen.queryByLabelText('Loading results')).not.toBeOnTheScreen();
  });

  it("offline, a new search shows the offline state, not the last search's rows", async () => {
    serveSearch(3);
    await renderScreen();
    await typeQuery('react');
    await screen.findByRole('button', { name: /^owner-1\/repo-1,/ });

    await act(() => {
      onlineManager.setOnline(false);
    });
    await typeQuery('vue');

    expect(
      await screen.findByRole('header', { name: "You're offline" }),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).not.toBeOnTheScreen();
  });

  it('says so when nothing matches', async () => {
    serveSearch(0);
    await renderScreen();

    await typeQuery('zzzz');

    expect(
      await screen.findByRole('header', {
        name: 'No repositories match "zzzz"',
      }),
    ).toBeOnTheScreen();
  });

  it('shows the error and recovers with Try again', async () => {
    let fail = true;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        if (fail) return HttpResponse.json({}, { status: 502 });
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json(buildSearchPage({ page, total: 1 }));
      }),
    );
    await renderScreen();
    await typeQuery('react');

    expect(
      await screen.findByRole('header', { name: 'GitHub is having trouble' }),
    ).toBeOnTheScreen();
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('button', { name: /^owner-1\/repo-1,/ }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('End of results')).toBeOnTheScreen();
  });

  it('shows the rate-limit banner with a countdown and no retry button', async () => {
    const resetEpoch = Math.floor(Date.now() / 1000) + 45;
    server.use(
      http.get(SEARCH_URL, () =>
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
        ),
      ),
    );
    await renderScreen();
    await typeQuery('react');

    expect(
      await screen.findByRole('header', { name: 'Search limit reached' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/^Search limit reached\. Resumes in 0:4\d\.$/),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeOnTheScreen();
  });

  it('shows the offline banner, and an offline state instead of a skeleton', async () => {
    serveSearch(1);
    onlineManager.setOnline(false);
    await renderScreen();

    expect(
      screen.getByText("You're offline. Showing what was loaded earlier."),
    ).toBeOnTheScreen();

    await typeQuery('react');

    await waitFor(() => {
      expect(
        screen.getByRole('header', { name: "You're offline" }),
      ).toBeOnTheScreen();
    });
  });
});
