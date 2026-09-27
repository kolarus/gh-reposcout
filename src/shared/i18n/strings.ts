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
    kilobytes: 'KB',
    megabytes: 'MB',
    gigabytes: 'GB',
    minutes: (n: number) => (n === 1 ? '1 minute' : `${String(n)} minutes`),
  },
  errors: {
    screenTitle: 'Something went wrong',
    screenMessage: 'This screen hit an unexpected problem.',
    tryAgain: 'Try again',
  },
  offline: {
    banner: "You're offline. Showing results loaded earlier.",
  },
  // Failures any GitHub request can have; screen-specific ones live with the screen.
  api: {
    networkTitle: "Can't reach GitHub",
    networkMessage: 'Check your connection and try again.',
    serverTitle: 'GitHub is having trouble',
    serverMessage: 'This is usually temporary. Try again in a moment.',
    unexpectedTitle: 'Something went wrong',
    unexpectedMessage: 'The request failed unexpectedly. Try again.',
    tryAgain: 'Try again',
  },
  search: {
    placeholder: 'Search repositories',
    clear: 'Clear search',
    loading: 'Loading results',
    sort: {
      label: 'Sort results',
      bestMatch: 'Best match',
      stars: 'Most stars',
      updated: 'Recently updated',
    },
    resultsCount: (count: number, formatted: string) =>
      count === 1 ? '1 repository' : `${formatted} repositories`,
    incomplete:
      'GitHub timed out part of this search, so some results may be missing.',
    recent: {
      title: 'Recent searches',
      remove: (query: string) => `Remove "${query}" from recent searches`,
    },
    suggestions: {
      title: 'Try searching for',
      queries: ['react-native', 'expo', 'typescript'],
    },
    empty: {
      title: (query: string) => `No repositories match "${query}"`,
      message: 'Try different keywords, or fewer qualifiers.',
    },
    offline: {
      title: "You're offline",
      message:
        'Search needs a connection. Results load once you are back online.',
    },
    errors: {
      rateLimitedTitle: 'Search limit reached',
      rateLimitedMessage:
        'GitHub allows 10 searches a minute without signing in. Results load automatically when the limit resets.',
      invalidTitle: "GitHub couldn't run this search",
      invalidMessage:
        'Check the query, e.g. qualifiers such as language:go or stars:>100.',
    },
    rateLimitBanner: (countdown: string) =>
      `Search limit reached. Resumes in ${countdown}.`,
    footer: {
      loadingMore: 'Loading more results',
      end: 'End of results',
      cap: 'Showing the first 1,000 results. Refine your search to see more.',
      loadMoreFailed: "Couldn't load more results.",
      paused: 'More results load when the search limit resets.',
      retry: 'Retry',
    },
  },
  repo: {
    updated: (relative: string) => `Updated ${relative}`,
    starsLabel: (formatted: string) => `${formatted} stars`,
    cardLabel: (parts: readonly string[]) => parts.join(', '),
  },
  // Phase 1b placeholders; replaced by the real screens in Phases 3–4.
  placeholders: {
    savedTitle: 'No saved repositories yet',
    savedMessage: 'Saved repositories will appear here and work offline.',
    settingsTitle: 'Settings',
    settingsMessage: 'Theme and data settings land in Phase 4.',
  },
  repoDetails: {
    invalidTitle: 'Repository not found',
    invalidMessage: "This link doesn't point to a valid GitHub repository.",
    notFoundTitle: 'Repository not found',
    notFoundMessage:
      'It may have been renamed, made private or deleted on GitHub.',
    loading: 'Loading repository',
    offlineTitle: "You're offline",
    offlineMessage: 'This repository loads once you are back online.',
    rateLimitedTitle: 'GitHub limit reached',
    rateLimitedMessage: (minutes: string) =>
      `GitHub allows 60 requests an hour without signing in. This repository loads in ${minutes}.`,
    rateLimitedNotice: (minutes: string) =>
      `GitHub's hourly limit is used up. Showing what was loaded earlier; it refreshes in ${minutes}.`,
    refreshFailed: "Couldn't refresh. Showing what was loaded earlier.",
    archived: 'This repository is archived and read-only.',
    homepage: 'Website',
    openOnGitHub: 'Open on GitHub',
    share: 'Share',
    topicsLabel: 'Topics',
    stats: {
      title: 'Stats',
      stars: 'Stars',
      forks: 'Forks',
      openIssues: 'Open issues',
      language: 'Language',
      license: 'License',
      defaultBranch: 'Default branch',
      size: 'Size',
      created: 'Created',
      updated: 'Updated',
      pushed: 'Last push',
      none: 'None',
    },
  },
  owner: {
    title: 'Owner',
    organization: 'Organization',
    user: 'User',
    followers: (formatted: string) => `${formatted} followers`,
    publicRepos: (formatted: string) => `${formatted} public repositories`,
    loading: 'Loading owner details',
    pausedMessage: (minutes: string) =>
      `Owner details are paused to save GitHub's hourly limit for repositories. The limit resets in ${minutes}.`,
    loadNow: 'Load now',
    rateLimitedMessage: (minutes: string) =>
      `GitHub's hourly limit is used up. Owner details load in ${minutes}.`,
    errorMessage: "Couldn't load owner details.",
    offlineMessage: 'Owner details load once you are back online.',
    retry: 'Retry',
    openProfile: (login: string) => `Open ${login} on GitHub`,
  },
  dev: {
    uiCatalog: 'UI catalog',
  },
} as const;
