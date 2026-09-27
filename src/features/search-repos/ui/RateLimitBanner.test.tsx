import { act, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { RateLimitBanner } from './RateLimitBanner';

const NOW = Date.parse('2026-09-26T12:00:00Z');

describe('RateLimitBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down every second and disappears at the reset time', async () => {
    const resetAt = new Date(NOW + 65_000).toISOString();
    await render(
      <ThemeProvider>
        <RateLimitBanner resetAt={resetAt} />
      </ThemeProvider>,
    );

    expect(
      screen.getByText('Search limit reached. Resumes in 1:05.'),
    ).toBeOnTheScreen();

    await act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText('Search limit reached. Resumes in 1:04.'),
    ).toBeOnTheScreen();

    await act(() => {
      jest.advanceTimersByTime(64_000);
    });
    expect(screen.queryByText(/Search limit reached/)).not.toBeOnTheScreen();
  });

  it('announces a steady message instead of every tick', async () => {
    await render(
      <ThemeProvider>
        <RateLimitBanner resetAt={new Date(NOW + 30_000).toISOString()} />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('alert', { name: /GitHub allows 10 searches a minute/ }),
    ).toBeOnTheScreen();
  });

  it('renders nothing for a reset time already past', async () => {
    await render(
      <ThemeProvider>
        <RateLimitBanner resetAt={new Date(NOW - 1000).toISOString()} />
      </ThemeProvider>,
    );

    expect(screen.queryByText(/Search limit reached/)).not.toBeOnTheScreen();
  });
});
