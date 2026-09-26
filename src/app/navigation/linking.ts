/**
 * Deep links: reposcout://repo/{owner}/{name} (ADR-0006). Paths come from the
 * per-screen `linking` entries in RootNavigator.
 */
export const linking = {
  enabled: 'auto' as const,
  prefixes: ['reposcout://'],
};
