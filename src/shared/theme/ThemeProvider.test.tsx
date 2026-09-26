import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { makeStyles } from './makeStyles';
import { useThemePreference } from './themePreference';
import { useTheme, ThemeProvider } from './ThemeProvider';
import { darkTheme, lightTheme } from './themes';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

const useSampleStyles = makeStyles(theme => ({
  box: { backgroundColor: theme.colors.surface },
}));

afterEach(async () => {
  await act(() => {
    useThemePreference.getState().setPreference('system');
  });
});

describe('ThemeProvider', () => {
  it('applies an explicit dark preference', async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper });

    await act(() => {
      useThemePreference.getState().setPreference('dark');
    });

    expect(result.current).toBe(darkTheme);
  });

  it('applies an explicit light preference', async () => {
    useThemePreference.getState().setPreference('light');
    const { result } = await renderHook(() => useTheme(), { wrapper });

    expect(result.current).toBe(lightTheme);
  });
});

describe('makeStyles', () => {
  it('creates styles once per theme and reuses them across renders', async () => {
    useThemePreference.getState().setPreference('light');
    const { result, rerender } = await renderHook(() => useSampleStyles(), {
      wrapper,
    });
    const first = result.current;

    await rerender({});
    expect(result.current).toBe(first);
    expect(first.box.backgroundColor).toBe(lightTheme.colors.surface);

    await act(() => {
      useThemePreference.getState().setPreference('dark');
    });
    expect(result.current).not.toBe(first);
    expect(result.current.box.backgroundColor).toBe(darkTheme.colors.surface);
  });
});
