import type { ColorSchemeName } from 'react-native';

import type { ThemePreference } from './themePreference';
import { darkTheme, lightTheme, type Theme } from './themes';

/** An explicit preference wins; `system` follows the OS appearance. */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null | undefined,
): Theme {
  switch (preference) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'system':
      return systemScheme === 'dark' ? darkTheme : lightTheme;
  }
}
