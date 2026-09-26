import { createContext, use, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { resolveTheme } from './resolveTheme';
import { useThemePreference } from './themePreference';
import { lightTheme, type Theme } from './themes';

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * Resolves the active theme from the user's preference and the OS appearance.
 * The value is one of two module-level theme objects, so consumers only
 * re-render when the theme actually changes (ADR-0010).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useThemePreference(state => state.preference);

  return (
    <ThemeContext value={resolveTheme(preference, systemScheme)}>
      {children}
    </ThemeContext>
  );
}

export function useTheme(): Theme {
  return use(ThemeContext);
}
