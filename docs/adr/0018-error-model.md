# 0018. Error model: typed `ApiError` union and layered error boundaries

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0007, ADR-0008, ADR-0012

## Context

The brief evaluates "error handling, loading states". Failures here are varied: offline, timeouts, rate limits, invalid queries (422), deleted repos (404), schema mismatches, server errors, and bugs in rendering. A generic "Something went wrong" wastes the information we have, and an unhandled render error takes down the whole app.

## Decision

**One error type for every network failure**, created in the API client (ADR-0008):

```ts
type ApiError =
  | { kind: 'network' } // offline, DNS, timeout, aborted by timeout
  | { kind: 'rate-limited'; resource: 'search' | 'core'; resetAt: string } // ISO date; countdown for that bucket (ADR-0012)
  | { kind: 'not-found' }
  | { kind: 'validation'; message: string } // 422 invalid query, or schema mismatch
  | { kind: 'http'; status: number } // other 4xx / 5xx
  | { kind: 'unexpected'; cause: unknown };
```

**How responses are classified** (in one place, the client):

| Response                                                                                      | Kind                                                                                                        |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| fetch throws (offline, DNS), or our timeout fires                                             | `network`                                                                                                   |
| We aborted the request ourselves (new query, unmount)                                         | not an error; ignored                                                                                       |
| 403 or 429 with `x-ratelimit-remaining: 0`, or with `retry-after` (GitHub's secondary limits) | `rate-limited`, `resource` from `x-ratelimit-resource`, `resetAt` from `x-ratelimit-reset` or `retry-after` |
| 404                                                                                           | `not-found`                                                                                                 |
| 422                                                                                           | `validation` (invalid search query)                                                                         |
| 2xx that fails the Zod schema                                                                 | `validation` (logged through monitoring)                                                                    |
| any other 4xx / 5xx                                                                           | `http`                                                                                                      |
| anything else                                                                                 | `unexpected`                                                                                                |

- The client throws an `ApiRequestError`: a real `Error` (stack trace, `cause`), because TanStack Query and error boundaries expect thrown errors, carrying the union as its `detail`. It's one wrapper class, not a hierarchy; code narrows on `detail.kind`, and `toApiError(error)` turns anything caught into an `ApiError` (non-API errors become `unexpected`).
- The UI maps `kind` → copy, icon and action with an exhaustive `switch` plus `assertNever`, rendered by `shared/ui/StateView`.
- Retry rules by kind are in ADR-0007.
- Requests we cancelled ourselves are not errors and are never shown.
- **Offline with cached data is not an error screen.** Show the data plus a banner (ADR-0011); for Details, see the ADR-0020 table.

**Error boundaries, in layers:**

1. **Root boundary**, in `app/providers` around the query client and navigation. A crash screen with "Try again"; the retry remounts navigation, which resets its state.
2. **Per-screen boundary**, applied once through each navigator's `screenLayout` (ADR-0006), so no screen can forget it. One broken screen doesn't take down the tabs.
3. **Per-section boundary** where one part can fail on its own (the owner card on Details).

The boundary is a small in-house class component (`shared/ui/ErrorBoundary`, about 40 lines) with a reset function and a replaceable fallback, so no dependency is needed. Caught render errors go to `shared/monitoring`.

**Global handlers** (`installGlobalErrorHandlers`, called once at app start):

- `ErrorUtils.setGlobalHandler` reports uncaught errors to `shared/monitoring`, then calls the previous handler, so React Native's own crash handling and LogBox keep working.
- Unhandled promise rejections are tracked through Hermes' `enablePromiseRejectionTracker`, in release builds only. In development React Native already tracks them for LogBox, and replacing its tracker would hide those warnings. `HermesInternal` is typed as an opaque object, so it's narrowed with a runtime check rather than a cast (ADR-0004).

**Monitoring interface** (`captureException`, `log`): logs to the console in development and does nothing in release for now. It's ready for a Sentry adapter ("with more time"). Schema mismatches are always reported.

## Future: observability and analytics (not built yet)

Only the `shared/monitoring` interface exists today. Added in order, each behind an interface so vendors stay swappable:

1. **Crash and error reporting.** Sentry (or Crashlytics or Bugsnag) as the `monitoring` adapter. Upload Hermes source maps in the release workflow, so stack traces point to real lines. Track crash-free sessions per release. Breadcrumbs from navigation, network and rate-limit events.
2. **Production performance monitoring.** App start (TTID/TTFD), slow and frozen frames per screen, GitHub request timings, and how often the rate-limit banner appears. This turns ADR-0017's one-off emulator measurements into continuous numbers from real devices.
3. **Product analytics.** A small `shared/analytics` interface with a **typed list of events** (`search_submitted`, `repo_saved`, `rate_limit_shown`, …). Every event and its properties are declared and reviewed; there are no free-form events. The adapter could be PostHog, Amplitude or Firebase. It is created only when the first consumer exists, so knip doesn't flag dead code.

Privacy rules for all tiers:

- No personal data. Search terms are treated as potentially sensitive and are never sent raw.
- Analytics are opt-in or disclosed in the app.
- Update the App Store privacy label, Play Store data-safety form and `PrivacyInfo.xcprivacy` (ADR-0023).
- No cross-app tracking, so no App Tracking Transparency prompt.
- Prefer OpenTelemetry-compatible tooling, to limit vendor lock-in.

## Alternatives considered

- **Throwing raw `Error`s or HTTP responses up to the UI.** Loses meaning; every screen would re-parse errors.
- **Class hierarchies (`class RateLimitError extends Error`).** Works, but `instanceof` is fragile across boundaries and serialisation, and discriminated unions narrow better in TypeScript.
- **One root boundary only.** One broken section would blank the whole app.
- **Adding Sentry now.** Needs account and DSN setup and has privacy implications. Out of scope; the interface keeps it a one-file change.

## Consequences

Positive:

- Specific, actionable messages. New error kinds are forced into every `switch` by the compiler.

Negative / accepted costs:

- Some boilerplate in the client to normalise errors (tested once, in one place).

## Enforcement

- TypeScript's `switch-exhaustiveness-check` and `assertNever`.
- Error normalisation has unit tests for each kind.
- The `rn-review` skill flags generic error copy where a typed kind exists, and new async UI without error or empty states.

## References

- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
