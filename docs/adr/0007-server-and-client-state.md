# 0007. TanStack Query for server state, Zustand for client state

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0008, ADR-0011, ADR-0012, ADR-0020

## Context

Almost all data comes from the GitHub API: paginated search results, repository details, owners. It needs caching, deduplication, cancellation, pagination, retries, offline pausing and persistence. The little genuinely local state is the theme preference, recent searches, saved repos and rate-limit status.

Mixing the two kinds of state in one store is a common source of bugs, for example cached server data copied into Redux and going stale.

## Decision

**Three kinds of state, three tools:**

| Kind               | Tool                                                                              | Examples                                                          |
| ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Server state       | **TanStack Query v5**                                                             | search pages, repository, owner                                   |
| Client (app) state | **Zustand** stores, small and owned by a slice, persisted where needed (ADR-0011) | theme preference, recent searches, saved repos, rate-limit status |
| Temporary UI state | component state                                                                   | input text, open pickers                                          |

Server data is **never copied** into Zustand.

**Query rules:**

- **Key factories per slice**: `repoKeys`, `ownerKeys`, `searchKeys`. Keys are hierarchical and built with `as const`, and never written inline.
- **Search** uses `useInfiniteQuery`: `initialPageParam: 1`, `per_page: 100` (as the brief specifies).
  - `getNextPageParam` stops at `min(total_count, 1000)` (GitHub's search cap) or on a short page.
  - Results are flattened in `select` and **deduplicated by `id`**, because ranking can shift between pages.
  - While a changed search (query or sort) loads, the **previous results stay on screen under a light veil** (`placeholderData` passes the previous data through), so the list never flashes back to a skeleton. The veiled rows are inert (no opening, scrolling or pull-to-refresh), since they're about to be replaced. Meanwhile a spinner replaces the search field's magnifier and screen readers hear "Loading results", so the faded rows aren't mistaken for the answer; it shows from the first keystroke, before the debounce has even sent a request. Previous results aren't shown when they were empty, or when the new search is paused offline: they'd answer a question the user no longer asked, so those cases show the skeleton and the offline state.
- **Opening a repo is instant, and usually free.** On row press, `seedRepoDetail` writes the search result into `repoKeys.detail(fullName)` as a complete record, with `updatedAt` set to when the search ran. Search results carry every field Details shows, so the screen renders at once and makes no repo request while that data is younger than Details' `staleTime`. After that, one background request refreshes it (ADR-0012). Seeding never replaces newer data, such as a Details view loaded a minute earlier.
- **Keys use the lowercased full name.** GitHub names are case-insensitive, so a deep link with different casing still hits the same cache entry.
- **What Details shows while loading:** data in the cache (live, or copied from search) > saved snapshot (complete but possibly older) > skeleton. The screen decides this explicitly in `resolveRepoDetailsView` (ADR-0020). The snapshot is _not_ passed as TanStack `placeholderData`, because placeholder data is ignored whenever the cache already holds seeded data.
- **Defaults:**
  - `staleTime`: search about 5 minutes, repo details about 10 minutes, owner profiles 1 hour (they rarely change, and each costs a core request)
  - `gcTime`: 24 hours (for persistence)
  - `refetchOnWindowFocus` through a `focusManager` tied to the app coming to the foreground
  - **Exception, the infinite search query:** TanStack refetches _every loaded page_ of a stale infinite query, so 10 loaded pages would spend the whole 10-requests-per-minute search budget at once (ADR-0012).
    - `refetchOnWindowFocus` and `refetchOnReconnect` are off.
    - `staleTime` is a function: 5 minutes while one page is loaded, `Infinity` once there are more. It has to be `staleTime`, not `refetchOnMount`: switching back to a cached search refetches it whenever it's stale, whatever `refetchOnMount` says (a test covers this).
    - **Pull-to-refresh** trims the cached data to page 1, then refetches: exactly one request, and page 1 stays on screen during the refresh. (`resetQueries` would also cost one request, but it empties the cache first, so the list would flash to a skeleton.)
  - `onlineManager` from NetInfo (ADR-0011)
- **Retry by error kind** (ADR-0018): never retry `rate-limited`, `not-found` or `validation`; retry `network` and 5xx up to 2 times with exponential backoff.
- **Zustand:** always read through selectors (`useStore(s => s.x)`), never the whole store. Actions live next to state inside the store.

## Alternatives considered

- **Redux Toolkit + RTK Query.** Capable, but heavier boilerplate for our few client-state needs. RTK Query's infinite-query support is younger.
- **SWR.** Lighter, but weaker infinite queries, persistence and devtools on React Native.
- **Hand-rolled fetching in `useEffect`.** We'd reimplement caching, deduplication, cancellation and race handling, and get them wrong.
- **Jotai / React Context for client state.** Jotai is fine but atom-heavy for a few stores. Context re-renders every consumer and doesn't persist.
- **Apollo / Relay.** GraphQL-only.

## Consequences

Positive:

- Caching, deduplication, abort, pagination, retry and persistence come from a well-tested library.
- Clear rule for where state lives.
- Instant navigation to Details.

Negative / accepted costs:

- Two state libraries to learn (both small).
- Query-key discipline is required. Lint and the key factories handle it.

## Enforcement

- `@tanstack/eslint-plugin-query`: exhaustive dependencies in keys, stable query client.
- The `rn-review` skill flags inline keys, server data copied into Zustand, and whole-store subscriptions.
- Tests cover `getNextPageParam` edge cases, deduplication and seeding.

## References

- https://tanstack.com/query/latest
- TkDodo, "Effective React Query Keys"
- https://zustand.docs.pmnd.rs/
