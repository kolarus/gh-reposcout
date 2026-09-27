import {
  createStaticNavigation,
  type StaticScreenProps,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onlineManager } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { delay, http, HttpResponse } from 'msw';

import { useRecentSearches } from '@/features/search-repos';
import { useRateLimit } from '@/shared/api';
import { Text } from '@/shared/ui';
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
  await render(
    <TestProviders queryClient={createTestQueryClient()}>
      <Navigation />
    </TestProviders>,
  );
}

/** Serves `total` results and records the `q` of every request. */
function serveSearch(total: number, { slow = false } = {}) {
  const queries: string[] = [];
  server.use(
    http.get(SEARCH_URL, async ({ request }) => {
      const params = new URL(request.url).searchParams;
      queries.push(params.get('q') ?? '');
      if (slow) await delay(150);
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

beforeEach(() => {
  useRecentSearches.getState().clear();
  useRateLimit.setState({ buckets: {} });
});

afterEach(() => {
  onlineManager.setOnline(true);
});

describe('SearchScreen', () => {
  it('goes from suggestions, through the skeleton, to result rows', async () => {
    serveSearch(3, { slow: true });
    await renderScreen();
    expect(
      screen.getByRole('header', { name: 'Try searching for' }),
    ).toBeOnTheScreen();

    await typeQuery('react');

    expect(await screen.findByLabelText('Loading results')).toBeOnTheScreen();
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

  it('opens a result in Details and remembers the search', async () => {
    serveSearch(3);
    await renderScreen();
    await typeQuery('react');

    await fireEvent.press(
      await screen.findByRole('button', { name: /^owner-2\/repo-2,/ }),
    );

    expect(await screen.findByText('details:owner-2/repo-2')).toBeOnTheScreen();
    expect(useRecentSearches.getState().queries).toEqual(['react']);
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
      screen.getByText("You're offline. Showing results loaded earlier."),
    ).toBeOnTheScreen();

    await typeQuery('react');

    await waitFor(() => {
      expect(
        screen.getByRole('header', { name: "You're offline" }),
      ).toBeOnTheScreen();
    });
  });
});
