/**
 * Design tokens (ADR-0010). Raw palette values live only here; everything else
 * uses the semantic names from `themes.ts`.
 *
 * Brand: forest green (scout uniform) with a tan secondary, chosen to stay
 * clearly distinct from GitHub's own brand colours (ADR-0023). The accent is
 * provisional until the mascot is picked.
 */
export const palette = {
  white: '#FFFFFF',
  green50: '#E8F5EE',
  green100: '#C9E8D6',
  green400: '#3FB883',
  green500: '#1F7A55',
  green600: '#186244',
  green900: '#16322A',
  green950: '#07130D',
  neutral50: '#F6F8F7',
  neutral100: '#EDF0EE',
  neutral150: '#E4E8E6',
  neutral200: '#DCE1DE',
  neutral500: '#5B6560',
  neutral400: '#9AA59F',
  neutral700: '#2A312D',
  neutral750: '#222825',
  neutral800: '#1C211F',
  neutral900: '#141816',
  neutral950: '#0D100E',
  neutralText: '#E8EDEA',
  red500: '#C9372C',
  red300: '#F07065',
  red50: '#FCE9E7',
  red950: '#3A1714',
  amber800: '#7A5200',
  amber300: '#F2C45A',
  amber50: '#FFF4D6',
  amber950: '#3A2C06',
} as const;

/** 4-point spacing scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** System font on purpose: zero bytes, native look, best Dynamic Type support. */
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const avatarSize = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

/** Minimum touch target (points). */
export const touchTarget = 44;
