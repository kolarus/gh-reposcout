# 0011. Persistence and offline: MMKV, persisted query cache, NetInfo

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0007, ADR-0020

## Context

Offline support is a listed bonus. Startup must be fast: reading persisted state must not block the first render or cause a flash of default content. The data involved is public GitHub metadata, with no personal or secret data.

## Decision

**Storage: `react-native-mmkv` v4**, a Nitro module that needs `react-native-nitro-modules`. Reads are synchronous and fast.

Separate instances, so each stays small and has a clear purpose:

| Instance        | Contents                                          | Lifetime                            |
| --------------- | ------------------------------------------------- | ----------------------------------- |
| `app`           | Zustand stores: theme preference, recent searches | until cleared                       |
| `query-cache`   | persisted TanStack Query cache                    | ≤ 24 h, reset on app version change |
| `saved`         | saved-repo snapshots (ADR-0020)                   | until the user removes them         |
| `saved-avatars` | avatar data URIs for saved repos (ADR-0020)       | reference-counted                   |

Instances are created with v4's `createMMKV({ id })` in `shared/storage`. Values kept outside a Zustand store (saved avatars) are read with `useStoredString`, which re-renders on MMKV's change events. Under Jest, MMKV detects the test environment and returns an in-memory store by itself, so persistence tests run the real code paths (ADR-0013).

**Zustand persistence:** the `persist` middleware with a _synchronous_ MMKV adapter (`toStateStorage` in `shared/storage`), so stores load before the first render with no loading flash.

- Each store declares a `version`, and adds a `migrate` function when the version is first bumped.
- Each store's `merge` validates what it reads back. An unknown or corrupted value falls back to the default instead of reaching the UI.

**Query persistence:** `PersistQueryClientProvider` with `@tanstack/query-async-storage-persister` wrapping the `query-cache` MMKV instance (`app/query/persistence.ts`). The sync persister is deprecated in TanStack Query v5 (checked 2026-09-26); the async one accepts a synchronous storage. Restoring the cache is asynchronous, which is fine: it only affects cached search and Details data, while the Zustand stores (theme, recent searches, saved repos) still load synchronously before the first render. Queries wait for the restore before fetching, so a restored entry is never fetched twice.

- **Opt-in per query:** a slice marks its queries with `meta: persistedQueryMeta` (`shared/api`, typed through TanStack's `Register`). The search, repo and owner queries opt in; `owner` is included so a previously opened Details screen is complete offline. Anything else stays in memory, so a new query is never written to storage by accident. Only successful queries are written.
- `maxAge: 24h` (equal to `gcTime`, ADR-0007, so restored entries aren't collected at once).
- `buster` = app version: a new version may change cached shapes, so it starts with an empty cache.
- **Size is capped** when the cache is serialised: the 5 newest entries of each key group (`search`, `repo`, `owner`), and only the first page of a search. A search page holds 100 repos (about 65 KB), so the cache stays around 350 KB at most, and storage and restore stay small. One page also keeps a restored search refreshable: with more pages loaded a search never goes stale on its own (ADR-0012).
- Writes are throttled to one a second. A cache that can't be read is discarded by TanStack and logged (`monitoring`); the app starts empty.
- **Settings → Clear cached results** removes the queries no screen is showing, and the persisted copy follows. What's on screen stays: removing it would only refetch it at once and spend rate limit (ADR-0012).

**Connectivity:** `@react-native-community/netinfo` feeds TanStack Query's `onlineManager` (wired in `app/query`, together with `AppState` → `focusManager`). The device counts as offline only when NetInfo says so explicitly (`isConnected === false` or `isInternetReachable === false`); an unknown (`null`) reachability doesn't pause queries.

- Offline, queries pause instead of failing.
- A global offline banner shows, and data marked stale stays visible.

**Encryption:** not used, because the data is public. We'd revisit if authentication or personal data is added.

## Alternatives considered

- **AsyncStorage.** Asynchronous: stores load after the first render (flash of defaults) and reads are slower.
- **SQLite / WatermelonDB / Realm.** Relational or query power we don't need, plus heavier native dependencies.
- **Persisting everything in one blob.** Slower startup, and no separation between cache and user data.
- **No persistence.** Loses the offline bonus and makes cold starts slower.

## Consequences

Positive:

- Instant, flash-free loading of saved state.
- Cached results are visible offline.
- Clear ownership of each storage instance.

Negative / accepted costs:

- A native dependency (MMKV plus Nitro); it passes the admission rule in ADR-0002.
- Cache caps mean older searches won't be available offline, by design. Saved repos cover the "must be available offline" case.

## Enforcement

- MMKV instances are created only in `shared/storage` (lint: `no-restricted-imports` for `react-native-mmkv` elsewhere).
- Persistence tests: write → recreate the store → rehydrate; corrupted data is dropped.
- Query persistence: an App-level test searches online, restarts the app (new query client), goes offline and gets the same results from storage with no request; unit tests cover the size cap and the opt-in filter.

## References

- https://github.com/mrousavy/react-native-mmkv (V4 upgrade guide)
- https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
