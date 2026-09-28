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
import { hide as hideSplash } from 'react-native-bootsplash';

import { useRecentSearches } from '@/features/search-repos';
import { queryCacheStorage } from '@/shared/storage';
import { expectAccessiblePressables } from '@/test/a11y';
import {
  buildSearchPage,
  buildUserDto,
  REPO_URL,
  SEARCH_URL,
  USER_URL,
} from '@/test/github';
import { server } from '@/test/server';

import App from './App';

beforeEach(() => {
  jest.useFakeTimers();
  queryCacheStorage.clearAll();
  useRecentSearches.getState().clear();
});

afterEach(async () => {
  await act(() => {
    jest.runOnlyPendingTimers();
  });
  await cleanup();
  onlineManager.setOnline(true);
  jest.useRealTimers();
});

describe('App', () => {
  it('starts on the Search tab with Saved and Settings available', async () => {
    await render(<App />);

    expect(
      await screen.findByLabelText('Search repositories'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Saved/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeOnTheScreen();
    expectAccessiblePressables();
  });

  it('hides the launch screen once navigation has rendered', async () => {
    await render(<App />);
    await screen.findByLabelText('Search repositories');

    expect(hideSplash).toHaveBeenCalledWith({ fade: true });
  });

  it('shows a search from the last session offline, after a restart', async () => {
    const queries: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        queries.push(new URL(request.url).searchParams.get('q') ?? '');
        return HttpResponse.json(buildSearchPage({ page: 1, total: 3 }));
      }),
    );
    const search = async (text: string) => {
      await fireEvent.changeText(
        await screen.findByLabelText('Search repositories'),
        text,
      );
      return screen.findByRole('button', { name: /^owner-1\/repo-1,/ });
    };

    await render(<App />);
    await search('react');
    // The cache is written at most once a second (ADR-0011).
    await act(() => jest.advanceTimersByTimeAsync(1000));
    await cleanup();

    // A new app instance, with a new, empty query client, and no network.
    onlineManager.setOnline(false);
    await render(<App />);

    expect(await search('react')).toBeOnTheScreen();
    expect(queries).toEqual(['react']);
  });
});

// The README's network table (ADR-0017): what a short session costs in
// GitHub requests, and the debounce and caches that keep it low (ADR-0012).
describe('GitHub requests in a scripted session', () => {
  it('debounces typing, reuses cached results, and opens Details from the result', async () => {
    const requests: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(`search ${params.get('sort') ?? 'best match'}`);
        return HttpResponse.json(
          buildSearchPage({ page: Number(params.get('page')), total: 3 }),
        );
      }),
      http.get(REPO_URL, () => {
        requests.push('repository');
        return HttpResponse.json({});
      }),
      http.get(USER_URL, ({ params }) => {
        requests.push('owner');
        return HttpResponse.json(buildUserDto(String(params['login'])));
      }),
    );
    /** The requests since the last call. */
    const sent = () => requests.splice(0);
    const firstResult = () =>
      screen.findByRole('button', { name: /^owner-1\/repo-1,/ });
    const resultsSettled = () =>
      waitFor(() => {
        expect(screen.queryByTestId('stale-results')).not.toBeOnTheScreen();
      });
    const query = 'react native';

    await render(<App />);
    const field = await screen.findByLabelText('Search repositories');

    // Typed at an easy pace: a keystroke every 150 ms.
    for (let length = 1; length <= query.length; length += 1) {
      await fireEvent.changeText(field, query.slice(0, length));
      await act(() => jest.advanceTimersByTimeAsync(150));
    }
    await firstResult();
    expect(sent()).toEqual(['search best match']);

    await fireEvent.press(screen.getByRole('button', { name: 'Most stars' }));
    await resultsSettled();
    expect(sent()).toEqual(['search stars']);

    await fireEvent.press(screen.getByRole('button', { name: 'Best match' }));
    await resultsSettled();
    expect(sent()).toEqual([]);

    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    await fireEvent.changeText(field, query);
    await act(() => jest.advanceTimersByTimeAsync(400));
    await firstResult();
    expect(sent()).toEqual([]);

    await fireEvent.press(await firstResult());
    expect(await screen.findByText(/ followers · /)).toBeOnTheScreen();
    expect(sent()).toEqual(['owner']);
  });
});
