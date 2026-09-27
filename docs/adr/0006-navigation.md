# 0006. React Navigation v7: static config, tabs + native stack, ID-only params

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0002, ADR-0005, ADR-0023

## Context

The app has three top-level areas (Search, Saved, Settings) and a Repository details screen reachable from Search, from Saved and from a deep link. Bare React Native rules out Expo Router (ADR-0002).

Facts as of 2026-09-26: React Navigation **8.0 is still pre-release**. Its alpha was announced in December 2025, with progress reports through July 2026. It brings native bottom tabs and better type inference. **v7 is the current stable release** and already has the static configuration API.

## Decision

- Use **React Navigation v7** with the **static configuration API**. Screen params and deep-link config are inferred from one declaration, and the global `ReactNavigation.RootParamList` is augmented so `useNavigation()` is typed without generics.
- **Layout:**

  ```
  RootStack (native-stack)
  ├── Tabs (bottom-tabs, JS implementation)
  │   ├── Search
  │   ├── Saved
  │   └── Settings
  └── RepoDetails   { owner: string; name: string }
  ```

  RepoDetails sits on the root stack, so it covers the tab bar and is reached the same way from any tab or deep link.

- **Params carry only identifiers** (`owner`, `name`), never objects. Data comes from the query cache: seeded from search results (ADR-0007) or from saved snapshots (ADR-0020). Deep links, state restoration and in-app navigation therefore behave the same.
- **One Details screen per repo:** `RepoDetails` has a `getId` of the lowercased `owner/name`, so opening another repo (a link, a saved repo) stacks a new screen instead of replacing the open one, and Back returns to it.
- **Deep links:** `reposcout://repo/:owner/:name`, via an Android intent filter and an iOS URL scheme. Params are validated against GitHub's login and repo-name patterns before any request; invalid ones show the not-found state.
  - The linking config sets the tabs as the initial route (`linking.config.initialRouteName: 'Tabs'`), so a deep-linked Details screen has a working back button to Search. The navigator's own `initialRouteName` doesn't apply to deep links. Found in the Phase 4 Android QA pass: without the linking option, a cold-start deep link opened Details with no back arrow, and Back closed the app.
  - The splash screen is hidden in `NavigationContainer`'s `onReady`, not in a specific screen. On a deep-link cold start the first screen is Details, not Search.
- **Lazy screens:** Details, Settings and the dev-only UI catalog are wrapped in `React.lazy(() => import(...))`, so their code runs on first navigation, not at startup. Search stays eager because it's the first screen.
  - The static API has no `getComponent` (that option exists only in the dynamic API), so `React.lazy` is the lazy-loading mechanism.
  - Each navigator sets `screenLayout` to wrap every screen in its own error boundary (ADR-0018) and a `Suspense` boundary for the lazy chunk. The fallback is `null`: the module is already in the single bundle, so `import()` only defers running it and resolves almost immediately. A spinner would just flash.
- **Dev-only routes** (the UI catalog, ADR-0010) use the static API's `if: useIsDevelopment` condition, so they don't exist in release builds, including for deep links.
- Navigators and linking live in `src/app/navigation/`. Screens are imported from `src/screens/*` (ADR-0005).
- The navigation theme is derived from our design tokens (ADR-0010).

## Alternatives considered

- **Expo Router.** Requires Expo (ADR-0002).
- **React Navigation 8 (alpha).** Pre-release software doesn't belong in a production-quality app. It's a planned upgrade once stable, mainly for native tabs.
- **React Navigation's dynamic API.** More boilerplate, and param types are declared by hand.
- **react-native-navigation (Wix).** Fully native, but a heavier native integration, a smaller community, and less flexibility for the static-typing story.
- **Native bottom tabs today** (`react-native-bottom-tabs`). One more native dependency for a benefit v8 will provide officially.

## Consequences

Positive:

- One typed source for routes, params and deep links.
- Screens are addressable by URL from day one.

Negative / accepted costs:

- JS tabs instead of platform-native tabs (no iOS 26 "liquid glass" look) until the v8 migration.
- A v7 → v8 migration later. It should be mostly mechanical because we use the static API.

## Enforcement

- TypeScript: navigating with the wrong params doesn't compile.
- The `rn-review` skill flags objects passed as params.
- Deep-link parsing has unit tests: they build the path config from the real navigator and the app's own `linking` options, as `createStaticNavigation` does, with `createPathConfigForStaticNavigation`, and resolve URLs with `getStateFromPath`. A renamed route or path, or a missing linking option, breaks a test.
- A Maestro flow opens a deep link.

## References

- https://reactnavigation.org/docs/static-configuration
- https://reactnavigation.org/blog/ (8.0 progress reports, 2026)
