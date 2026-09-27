# 0012. Handle GitHub rate limits in the app; no authentication, no secrets

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0007, ADR-0008, ADR-0018

## Context

GitHub's unauthenticated limits are the biggest UX risk in this app:

| API                       | Unauthenticated      | Authenticated       |
| ------------------------- | -------------------- | ------------------- |
| Search (`/search/*`)      | **10 requests/min**  | 30 requests/min     |
| Core (`/repos`, `/users`) | **60 requests/hour** | 5,000 requests/hour |

Search is also capped at the first 1,000 results. A naive search-as-you-type implementation hits the limit within seconds, and the app looks broken.

Any token bundled into a mobile app is extractable from the binary. Proper authentication (an OAuth device flow or a backend proxy) is out of scope for this assignment.

## Decision

**No authentication, tokens or secrets of any kind** in the app, its configuration or CI builds. The app uses only public, unauthenticated endpoints.

**Staying under the limits:**

- Debounce typing by **400 ms**, with a **minimum of 2 characters**. Pressing "search" on the keyboard skips the debounce.
- Cancel requests that are no longer needed (AbortSignal).
- Normalise queries (ADR-0008) and deduplicate identical requests through the cache (ADR-0007). Search `staleTime` is about 5 minutes.
- Fetch the next page only near the end of the list, never eagerly. With `per_page=100` that's at most 10 requests per query.
- **Never refetch all loaded pages at once.** TanStack refetches every page of a stale infinite query, which could spend the whole minute's budget in one go. Search therefore doesn't refetch on app focus or reconnect, a search with several pages loaded never goes stale on its own, and pull-to-refresh refetches page 1 only (ADR-0007).

**Spending the core budget (60 requests an hour, shared by repo and owner requests):**

- **Opening a repo from search costs no repo request.** A search result already carries every field Details shows, so row press copies it into the Details cache (ADR-0007) as a fresh record. Details stays fresh for about 10 minutes from when the search ran; after that, one background request refreshes it.
- **Details shows no "watchers" figure.** Search results don't carry the real watcher count (their `watchers_count` repeats the star count), and fetching the repo only for that number would cost a request per open.
- **Owner profiles are cached per owner for an hour.** The owner card shows login, avatar and account type from the repo data straight away; the profile (`/users/{login}`) adds name, bio and follower counts. Opening five repos from one organisation costs one profile request.
- **A reserve for requests that can't be skipped.** When the last known core budget is at 5 requests or fewer, owner profiles and saved-snapshot completion (ADR-0020) stop loading on their own. The owner card says when the limit resets and offers a "Load now" button. A deep link to a repo that isn't cached needs its repo request, so the budget is kept for it.
- **Deep links use current names.** A renamed repo answers with a redirect, and following it costs a second request. Cache keys use the canonical `full_name` from the response.
- **Across restarts:** the persisted query cache (ADR-0011) keeps repos and owner profiles, so reopening recently viewed ones costs nothing.

| Action                                          | Core requests                                  |
| ----------------------------------------------- | ---------------------------------------------- |
| Open a result, search less than ~10 minutes old | 0, plus 1 if that owner's profile isn't cached |
| Open a result, older search                     | 1 in the background, plus the owner as above   |
| Deep link                                       | 1 (2 if the repo was renamed), plus the owner  |
| Pull to refresh on Details                      | 1                                              |

**When a limit is hit:**

- Every response's `x-ratelimit-resource` / `x-ratelimit-remaining` / `x-ratelimit-reset` / `retry-after` headers go into a small rate-limit store, **keyed by bucket**. `search` and `core` are separate budgets, so running out of one must not block the other.
- A `rate-limited` error is **never retried automatically**.
  - Search bucket: a banner on Search shows a **live countdown** to the reset time, then refetches automatically. The banner also appears as soon as a response reports `x-ratelimit-remaining: 0`, before a search actually fails. Its spoken text is a fixed sentence, so screen readers aren't interrupted every second.
  - Core bucket: Details keeps showing what it has (pre-filled or snapshot data) with an inline notice and the reset time. Search keeps working.
- **Details keep working when the core limit is exhausted.** They're pre-filled from search results (ADR-0007) or saved snapshots (ADR-0020). The owner section fails on its own without breaking the screen.

**Future-proofing:** all request headers are built in one function in `shared/api/github/client.ts`, so a token provider (OAuth) or a proxy base URL can be added in one place.

## Alternatives considered

- **Bundling a personal access token.** It can be extracted from the APK or IPA. That's a security issue and violates GitHub's terms. Rejected.
- **A token for local development only.** Considered, then dropped by the project owner to keep the setup simple and remove any risk of it leaking into a release build.
- **OAuth device flow** (user signs in): lifts limits to 30 requests/min for search and 5,000/hour for the rest. Worthwhile with more time; listed in the README.
- **Backend proxy with a server-side token and shared caching.** The production answer at scale; out of scope.
- **Conditional requests (`ETag` / `If-None-Match`).** GitHub's `304 Not Modified` answers are free only for authenticated requests. Tested on 2026-09-27 without a token: each `304` still took one request off the core budget (53 → 52 → 51). They would save bandwidth, not budget, so they're not worth the client complexity here.

## Consequences

Positive:

- No secrets to manage or leak. The rate-limit UX is a visible piece of polish.

Negative / accepted costs:

- Heavy users (and reviewers testing quickly) will see the rate-limit banner. The README explains why, and what we'd do with more time.

## Enforcement

- Tests cover debounce, cancellation, header parsing, no retry on `rate-limited`, and the countdown (fake timers).
- The `rn-review` skill flags new eager fetches or retries of errors that shouldn't be retried.
- CI release builds have no secret environment variables other than the signing keys (ADR-0016).

## References

- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/rest/search/search#rate-limit
