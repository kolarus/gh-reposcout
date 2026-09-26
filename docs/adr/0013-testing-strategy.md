# 0013. Testing strategy: Jest + React Native Testing Library + MSW; Maestro for end-to-end

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0008, ADR-0016, ADR-0021, ADR-0022

## Context

We want confidence per minute of test time: fast checks for logic and behaviour, and a few end-to-end flows that prove the real app works on both platforms. Tests must not depend on live GitHub rankings or rate limits.

As of 2026-09-26:

- React Native 0.87 ships `@react-native/jest-preset` as a package.
- MSW v2 in React Native's Jest environment needs polyfills (fetch/streams, URL, TextEncoder).

## Decision

| Layer               | Tooling                                                                                    | What it covers                                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                | Jest                                                                                       | Pure logic: mappers, formatters (fixed clock), query normalisation, rate-limit header parsing, error normalisation, `getNextPageParam` edge cases, `resolveRepoDetailsView` (one test per table row, ADR-0020)                                                                                                                   |
| Hooks / integration | Jest + React Native Testing Library + **MSW**, with a real query client and a fake network | `useRepoSearch`: debounce, cancellation, pagination up to the 1,000 cap, deduplication, each error kind; a rate-limit response drives the banner state and countdown for its own bucket only (`search` vs `core`); queries pause offline                                                                                         |
| Component / screen  | React Native Testing Library                                                               | Search: type → skeleton → rows; empty; error + Retry; offline banner. Details: pre-filled render → full data; an owner-section error stays isolated; snapshot badge when offline                                                                                                                                                 |
| Contract            | Jest + captured fixtures                                                                   | Schemas accept real GitHub payloads (captured once, stored in `src/test/fixtures`)                                                                                                                                                                                                                                               |
| Saved / offline     | Jest + React Native Testing Library + MSW                                                  | save → persisted → recreate the store and load from disk → offline Details shows the snapshot and badge; corrupted entry dropped; migration test when the snapshot version changes; avatar reference counting                                                                                                                    |
| End-to-end          | **Maestro**, release builds, dedicated local devices (ADR-0021)                            | 3 flows: (1) search → scroll → Details → back; (2) theme toggle; (3) save → go offline → Saved tab → Details shows the snapshot badge. Flow 3 is **Android-only**: it uses Maestro's `setAirplaneMode`, and iOS simulators have no airplane mode (checked 2026-09-26). On iOS, offline behaviour is covered by the screen tests. |

**Rules:**

- Query by role and text (accessibility-first). Use `testID` only where Maestro needs it.
- Fixture factories: `buildRepoDto(overrides)`.
- Fake timers for debounce and countdown tests.
- End-to-end tests assert structure ("first row visible", "stars shown"), never specific repos or rankings.
- Tests sit next to the code they test (`X.test.tsx`). Shared helpers live in `src/test/`.
- Coverage is reported in CI without a gate. A gate on critical modules (`shared/api`, mappers, `save-repo` ≥ 90%) is in the improvements backlog.

**MSW in React Native's Jest environment** (spike done in Phase 0, within its 30-minute time-box):

- MSW 2 works **without polyfills**. The React Native preset runs on Jest's Node environment, and Node 24 provides `fetch`, streams, `URL` and `TextEncoder`.
- Two configuration tweaks were needed:
  - `msw/node` is mapped to MSW's CommonJS build, because MSW's `exports` map deliberately returns nothing for the `react-native` condition that the environment uses. The mapping is scoped to MSW: adding the `node` condition globally would pull Node builds of React Native libraries into tests.
  - MSW's few ES-module-only runtime dependencies (`rettime`, `until-async`, and a nested `@open-draft/deferred-promise`) go through Babel like React Native's own packages.
- Every request without a handler fails the test (`onUnhandledRequest: 'error'`), so no test can reach the real network.
- The fallback (an injected fake `fetch`, ADR-0008) isn't needed, but the client stays injectable.

**Libraries:** Jest 29 (from the template) with `@react-native/jest-preset`; React Native Testing Library 14, which renders with the new `test-renderer` package (the old `react-test-renderer` is deprecated); `react-native-safe-area-context`'s official Jest mock. The repo scripts' own tests use Node's built-in `node:test` runner (`yarn test:scripts`).

## Alternatives considered

- **Vitest.** React Native support is still immature compared with Jest's preset.
- **Mocking `fetch` or modules directly.** Brittle and tied to implementation. MSW tests at the network boundary.
- **Detox.** Powerful, but more native setup and flakier synchronisation. Maestro's YAML flows are simpler and work the same on both platforms.
- **Appium.** Heavy for this scope.
- **Snapshot tests.** Low signal and high churn. Not used, except possibly for small pure outputs.

## Consequences

Positive:

- Fast feedback, and behaviour is tested the way a user sees it.
- End-to-end flows double as scripted demo videos (ADR-0021).

Negative / accepted costs:

- MSW polyfill setup. End-to-end tests against the live API can still be flaky: the wrapper script retries a failed flow once, and flows assert structure only. There's no offline end-to-end flow on iOS (simulator limitation). A mock-server app variant for deterministic end-to-end tests, and Reassure render-performance tests, are in the improvements backlog.

## Enforcement

- `yarn test` runs in the pre-push hook (a failing test blocks the push) and in CI on every push. Android end-to-end tests run in CI nightly and on demand as a **non-blocking** job (ADR-0016), and locally through the scripts (ADR-0021).
- `eslint-plugin-testing-library` and `eslint-plugin-jest`.
- The `rn-review` skill flags new mappers or hooks without tests.

## References

- https://callstack.github.io/react-native-testing-library/
- https://mswjs.io/docs/integrations/react-native/
- https://maestro.mobile.dev
