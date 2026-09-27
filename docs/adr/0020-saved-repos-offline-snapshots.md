# 0020. Saved repos: user-owned offline snapshots, kept separate from the query cache

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0005, ADR-0007, ADR-0009, ADR-0011

## Context

The project owner wants users to **save repos locally and view them offline**, with a snapshot of the data that is kept until the user removes it.

- The query cache (ADR-0011) is best-effort: it expires after 24 hours, is capped in size and is reset on app updates. It can't make that promise.
- Image caches evict their oldest entries when full, so they can't guarantee offline avatars either. That's true of core `Image` and of FastImage alike (ADR-0009).
- GitHub "stars" live on the server and need authentication (ADR-0012), so calling this feature "Starred" would mislead users.

## Decision

**Name:** **"Saved"**, with a bookmark icon, not "Starred". The README explains why.

**Two separate persistence tiers:**

|          | Query cache                         | Saved snapshots                |
| -------- | ----------------------------------- | ------------------------------ |
| Owner    | the app                             | the user                       |
| Lifetime | ≤ 24 h, reset on app version change | until the user removes it      |
| Eviction | yes                                 | never automatic                |
| Storage  | MMKV `query-cache`                  | MMKV `saved` + `saved-avatars` |

**Slice:** `features/save-repo` (ADR-0005). It depends only on `entities/repo` _types_.

**Model:**

- `SavedRepoSnapshotV1 = { version: 1, savedAt, refreshedAt, repo: RepoDetails, owner?: OwnerDetails }`. It holds domain types, never API shapes, and dates are ISO strings.
- **Store shape:** `{ byId: Record<RepoId, Snapshot>, order: RepoId[], idByFullName: Record<string, RepoId> }`.
  - Keyed by the numeric repo `id`, which survives renames.
  - `idByFullName` (lowercased) lets Details look a snapshot up from its route params (`owner`, `name`), which carry no id. It isn't persisted: loading rebuilds it from the snapshots, so it can't drift from them.
- **Storage format:** JSON can't hold `undefined`, so the store writes it as `null` and the snapshot schema reads it back as `undefined`. The schemas are checked against the domain types (`satisfies`), so a field added to `RepoDetails` or `OwnerProfile` fails to compile until the snapshot schema has it.
  - `useIsSaved(id)` is an O(1) selector, so a list row re-renders only when _its own_ saved flag changes.
- **Loading from disk:** each entry is validated with Zod. Invalid entries are dropped and logged, never crashing the app.
- **Upgrades:** Zustand `persist` `version` / `migrate` handles future changes to the snapshot shape.
- **Complete snapshots on save, within budget:**
  - Search results carry every repo field Details shows (ADR-0012), so a snapshot saved from search is complete except for the owner profile.
  - If the device is online and the core budget is above the reserve (ADR-0012), saving also fetches the owner profile in the background, using `entities` query options (features may import entities). A snapshot saved from a deep-linked repo already has everything the screen loaded.
  - Otherwise it's completed on the next online Details view (`useSyncSnapshot`), which also refreshes a saved repo's data when Details has newer data, and retries a missing avatar.
  - Offline Details without owner data says "owner details weren't saved" in that section.

**Avatars:**

1. On save, download the sized avatar (`s=<px>`, at the Details hero's size) as a **data URI** with `shared/api/fetchAsDataUri`. It reads the response as bytes and base64-encodes them itself, which behaves the same on Hermes and in Jest (Jest has no `FileReader`). The helper lives in `shared/api` because `fetch` is only allowed there (ADR-0015).
2. Store it in MMKV `saved-avatars`, **keyed by owner login**, so many repos from one owner share one image (about 5–15 KB each).
3. Load it lazily per row; it's never held in the store.
4. If the download fails, the save still succeeds: show an initials fallback and retry on the next online view.
5. The avatar CDN doesn't count against the API rate limit.
6. When no saved repo references an owner any more, the avatar is deleted (reference counting).
7. Details picks its avatar source once, when the repo first shows: the saved copy if there is one, otherwise the network image. Saving or unsaving while it's open doesn't swap the image. Found on device: a new source remounts the image, which flickered through the initials on every save and unsave.

We'd move to file storage only if the saved count grows large; there's a soft cap and warning at about 500.

**Details screen composition** (the screen layer combines; the slices stay independent):

```
screens/repo-details/useRepoDetailsView.ts
   ├─ entities/repo:       useRepository(owner, name)      // cache may hold live data, data copied from search, or nothing
   ├─ features/save-repo:  useSavedSnapshot(fullName)      // via the lowercased idByFullName index
   ├─ features/save-repo:  useSyncSnapshot(liveRepo)       // updates only if saved and the data changed
   └─ resolveRepoDetailsView(query, snapshot) → view state (pure function)
```

**What to show while loading:** data in the cache (live, or copied from search) > saved snapshot (complete but possibly older) > skeleton. The resolver picks explicitly. The snapshot isn't passed as TanStack `placeholderData`, because placeholder data is ignored whenever the cache already holds seeded data.

| Live request            | Snapshot? | User sees                                                                                          |
| ----------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| loading                 | yes       | snapshot straight away (unless full data is already cached), swapped for live data when it arrives |
| loading                 | no        | data copied from search, or a skeleton                                                             |
| success                 | any       | live data; if saved and changed, the snapshot quietly updates                                      |
| network / offline error | yes       | snapshot + "Saved snapshot · 3d ago" badge (no error state)                                        |
| network / offline error | no        | data copied from search + offline banner, or error state + Retry                                   |
| 404                     | yes       | snapshot + "no longer available on GitHub" notice                                                  |
| other error             | any       | typed error state + Retry (snapshot shown if present)                                              |

**UI:**

- `SaveToggle` (a bookmark) on each result row, through `RepoCard`'s `accessory` slot (ADR-0005), and next to Details' Open on GitHub / Share. Not in the navigation header: the toggle then needs no navigation wiring, and it stays where the other actions are. It has an accessibility role, label and selected state, and a light haptic (ADR-0010); a spoken announcement is part of the deferred accessibility pass.
- A Saved tab (sorted by date saved), with a remove action and an empty state explaining offline availability. An undo toast is in the improvements backlog.
- Settings → "Remove saved repositories", with a confirmation: removes every snapshot and every stored avatar (`clearSavedRepos`).

## Alternatives considered

- **Relying on the persisted query cache.** Expires and gets evicted, so it can't guarantee "saved".
- **FastImage or image-cache avatars.** Evicted when the cache fills; no guarantee.
- **Avatar files on the filesystem** (`react-native-fs` / blob-util). Robust at scale, but a native dependency we don't need at this size.
- **Server-side GitHub stars.** Needs authentication (ADR-0012), and changes the user's real account.
- **SQLite.** Unnecessary for a list of key → value snapshots.

## Consequences

Positive:

- Guaranteed offline access with honest labelling.
- No new native dependencies.
- The view logic is a pure function that is easy to test.

Negative / accepted costs:

- Snapshots can be days old (shown with an age badge). Data URIs grow MMKV storage (bounded by the soft cap).

## Enforcement

- `resolveRepoDetailsView` has one test per table row.
- Persistence tests: loading from disk, corruption, migration, avatar reference counting.
- A Maestro flow: save → go offline → Saved tab → Details shows the badge.
- Boundaries lint: no feature imports `save-repo`.

## References
