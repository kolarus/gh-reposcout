/**
 * Copy for the developer-only UI catalog. Not user-facing, so it deliberately
 * doesn't go through shared/i18n (ADR-0019 covers user-facing copy).
 */
export const catalogCopy = {
  subtitle: 'Design tokens and shared components in the current theme.',
  sections: {
    theme: 'Theme',
    colors: 'Colours',
    typography: 'Typography',
    buttons: 'Buttons',
    chips: 'Chips',
    icons: 'Icons',
    avatars: 'Avatars',
    banners: 'Banners',
    skeleton: 'Skeleton',
    stateView: 'State view',
  },
  themes: { system: 'System', light: 'Light', dark: 'Dark' },
  sample: 'The quick brown fox jumps over the lazy dog',
  buttons: {
    primary: 'Primary',
    secondary: 'Secondary',
    plain: 'Plain',
    disabled: 'Disabled',
    withIcon: 'Open on GitHub',
  },
  chips: {
    topic: 'react-native',
    best: 'Best match',
    stars: 'Stars',
    updated: 'Updated',
  },
  avatarName: 'Facebook',
  // A real GitHub avatar, requested at display size (s=192 → 96 pt @2x).
  avatarUri: 'https://avatars.githubusercontent.com/u/69631?v=4&s=192',
  banners: {
    info: 'Showing saved snapshot from 3 days ago.',
    warning: 'Search limit reached. Resumes in 0:42.',
    danger: "You're offline. Showing cached results.",
    retry: 'Retry',
  },
  stateView: {
    title: 'No repositories found',
    message: 'Try a different search term or remove a filter.',
    action: 'Clear search',
  },
} as const;
