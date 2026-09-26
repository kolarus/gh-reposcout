/**
 * All user-facing copy (ADR-0019). Components never contain literal text, so a
 * future i18n library replaces this module, not its callers.
 */
export const strings = {
  tabs: {
    search: 'Search',
    saved: 'Saved',
    settings: 'Settings',
  },
  format: {
    justNow: 'just now',
    minutesAgo: (n: number) => `${String(n)}m ago`,
    hoursAgo: (n: number) => `${String(n)}h ago`,
    daysAgo: (n: number) => `${String(n)}d ago`,
    monthsAgo: (n: number) => `${String(n)}mo ago`,
    yearsAgo: (n: number) => `${String(n)}y ago`,
    thousandSuffix: 'k',
    millionSuffix: 'M',
  },
  errors: {
    screenTitle: 'Something went wrong',
    screenMessage: 'This screen hit an unexpected problem.',
    tryAgain: 'Try again',
  },
  // Phase 1b placeholders; replaced by the real screens in Phases 2–4.
  placeholders: {
    searchTitle: 'Search is coming next',
    searchMessage: 'Repository search lands in Phase 2.',
    searchSample: 'Open facebook/react-native',
    savedTitle: 'No saved repositories yet',
    savedMessage: 'Saved repositories will appear here and work offline.',
    settingsTitle: 'Settings',
    settingsMessage: 'Theme and data settings land in Phase 4.',
    detailsTitle: (fullName: string) => fullName,
    detailsMessage: 'Repository details land in Phase 3.',
  },
  repoDetails: {
    invalidTitle: 'Repository not found',
    invalidMessage: "This link doesn't point to a valid GitHub repository.",
  },
  dev: {
    uiCatalog: 'UI catalog',
  },
} as const;
