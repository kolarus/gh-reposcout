/**
 * Deep links: reposcout://repo/{owner}/{name} (ADR-0006). Paths come from the
 * per-screen `linking` entries in RootNavigator.
 */
export const linking = {
  enabled: 'auto' as const,
  prefixes: ['reposcout://'],
  // The tabs go under a deep-linked screen, so Back from Details returns to
  // Search instead of leaving the app. The navigator's own initialRouteName
  // doesn't apply to deep links; only this does.
  config: { initialRouteName: 'Tabs' as const },
};
