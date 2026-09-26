import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from './ThemeProvider';
import type { Theme } from './themes';

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Creates a `useStyles()` hook for a component's `X.styles.ts` (ADR-0005,
 * ADR-0010). Styles are built once per theme object and cached, so switching
 * theme costs one `StyleSheet.create` per component, and renders cost nothing.
 *
 * `S & NamedStyles` mirrors `StyleSheet.create`'s own signature: the
 * intersection gives the factory's object literal a contextual type, so values
 * like `'row'` keep their literal types instead of widening to `string`.
 */
export function makeStyles<S extends NamedStyles>(
  factory: (theme: Theme) => S & NamedStyles,
): () => Readonly<S> {
  const cache = new WeakMap<Theme, Readonly<S>>();

  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    const cached = cache.get(theme);
    if (cached !== undefined) return cached;

    const styles = StyleSheet.create(factory(theme));
    cache.set(theme, styles);
    return styles;
  };
}
