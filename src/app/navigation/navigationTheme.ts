import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import type { Theme } from '@/shared/theme';

const cache = new WeakMap<Theme, NavigationTheme>();

/**
 * React Navigation's theme derived from our tokens, so headers, tab bar and
 * screen backgrounds switch together with the app theme (ADR-0010).
 */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const cached = cache.get(theme);
  if (cached !== undefined) return cached;

  const base = theme.name === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: NavigationTheme = {
    ...base,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
  cache.set(theme, navigationTheme);
  return navigationTheme;
}
