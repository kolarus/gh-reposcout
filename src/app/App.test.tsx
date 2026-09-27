import { onlineManager } from '@tanstack/react-query';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { queryCacheStorage } from '@/shared/storage';
import { expectAccessiblePressables } from '@/test/a11y';
import { buildSearchPage, SEARCH_URL } from '@/test/github';
import { server } from '@/test/server';

import App from './App';

beforeEach(() => {
  jest.useFakeTimers();
  queryCacheStorage.clearAll();
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
