import {
  avatarSize,
  iconSize,
  palette,
  radii,
  spacing,
  touchTarget,
  typography,
} from './tokens';

type ThemeName = 'light' | 'dark';

/**
 * Semantic colours: components use these names, never raw palette values.
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentMuted: string;
  onAccent: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  skeleton: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  iconSize: typeof iconSize;
  avatarSize: typeof avatarSize;
  touchTarget: typeof touchTarget;
}

const shared = {
  spacing,
  radii,
  typography,
  iconSize,
  avatarSize,
  touchTarget,
} as const;

/**
 * Theme objects are module-level constants: `makeStyles` caches styles by
 * theme identity, so styles are created once per theme, never per render.
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: palette.neutral50,
    surface: palette.white,
    surfaceMuted: palette.neutral100,
    border: palette.neutral200,
    textPrimary: palette.neutral900,
    textSecondary: palette.neutral500,
    accent: palette.green500,
    accentMuted: palette.green50,
    onAccent: palette.white,
    danger: palette.red500,
    dangerMuted: palette.red50,
    warning: palette.amber800,
    warningMuted: palette.amber50,
    skeleton: palette.neutral150,
  },
  ...shared,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceMuted: palette.neutral800,
    border: palette.neutral700,
    textPrimary: palette.neutralText,
    textSecondary: palette.neutral400,
    accent: palette.green400,
    accentMuted: palette.green900,
    onAccent: palette.green950,
    danger: palette.red300,
    dangerMuted: palette.red950,
    warning: palette.amber300,
    warningMuted: palette.amber950,
    skeleton: palette.neutral750,
  },
  ...shared,
};
