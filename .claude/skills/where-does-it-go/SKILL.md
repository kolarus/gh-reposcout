---
name: where-does-it-go
description: Decide where new or moved code belongs in RepoScout's layered structure (app → screens → features → entities → shared) and, on request, scaffold the files. Use before creating any new file, component, hook, store, API call or util; when unsure which layer or slice something belongs to; when a lint boundaries error suggests code is in the wrong place; or when the user asks "where should X go?".
---

# where-does-it-go

Places code according to **ADR-0005 (layered feature-sliced structure)**. That ADR is binding; if this skill and the ADR disagree, the ADR wins, and you should report the mismatch.

## Inputs

A short description of the code, e.g. "a hook that returns whether the device is offline", "a chip showing a repo's license", "clear all saved repos from Settings". If files already exist, read them first.

## Step 1: Classify with the placement guide (ask in order; stop at the first "yes")

1. **Would another app use it unchanged?** (no knowledge of repos, owners or GitHub domain rules) → `shared/<segment>`
2. **Is it a business _thing_** (a noun: its data, types, mapping, how it's fetched or displayed)? → `entities/<noun>`
3. **Is it something the user _does_** (a verb: an action with its UI and state)? → `features/<verb-noun>`
4. **Does it combine several of the above for one screen?** → `screens/<screen>`
5. **Is it global setup or wiring** (providers, navigation, query client)? → `app/`

## Step 2: Pick the slice and segment

- **Slice:** reuse an existing slice if the code clearly belongs to it (list `src/<layer>/`). Create a new slice only for a new noun or verb. Names are kebab-case: entities are nouns (`repo`, `owner`); features are verb-noun (`search-repos`, `save-repo`).
- **Segment** inside the slice, using only these names:
  - `api/`: network calls and Zod schemas (`*.schema.ts`). Only here and in `model/` may schemas be imported.
  - `model/`: types, mappers (API shape → domain), pure logic.
  - `queries/`: TanStack hooks and the key factory for this slice.
  - `store/`: Zustand store (persisted through `shared/storage`).
  - `hooks/`: other React hooks.
  - `lib/`: slice-private helpers.
  - `ui/`: components, each as `X.tsx` + `X.styles.ts` (+ `X.test.tsx`).
- `shared/` segments: `api/github`, `ui`, `theme`, `lib`, `storage`, `config`, `i18n`, `monitoring`.

## Step 3: Check the import rules (ADR-0005 table)

| Layer    | May import                                     |
| -------- | ---------------------------------------------- |
| app      | screens, features, entities, shared            |
| screens  | features, entities, shared (not other screens) |
| features | entities, shared (**never other features**)    |
| entities | shared (**never other entities**)              |
| shared   | shared only                                    |

If the code would need a same-layer import, **move the combining logic up, not sideways**: compose in the screen, or pass data in as arguments. Example: `save-repo` receives repo data through `useSyncSnapshot(repo)` and doesn't import the repo query.

## Step 4: Answer in this format

```
Placement: src/<layer>/<slice>/<segment>/<File>.tsx
Why: <which question in step 1 matched, one line>
Files:
  - <File>.tsx
  - <File>.styles.ts        (if UI)
  - <File>.test.tsx         (if logic worth testing)
Public API: add `export { File } from './<segment>/<File>'` to src/<layer>/<slice>/index.ts   (only if used outside the slice)
Imports allowed: <list per the table>
Watch out: <boundary risks, e.g. "don't import features/search-repos here; compose in screens/search">
ADR refs: 0005 (+ any area ADR: 0007 queries, 0008 API, 0010 styling, 0020 saved…)
```

If the user asked to scaffold, create the files:

- component + `makeStyles` styles file + test stub
- export added to the slice's `index.ts` if needed
- TSDoc on the export (ADR-0024)

Then run `yarn lint` on the new files and `yarn check:architecture`.

## Worked examples (from this codebase)

| Code                                                | Placement                                    | Reason                                                                      |
| --------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `formatCompactNumber`                               | `shared/lib/format.ts`                       | Q1: generic                                                                 |
| `Button`, `Chip`, `StateView`                       | `shared/ui/`                                 | Q1: generic primitives                                                      |
| GitHub fetch wrapper, `ApiError`                    | `shared/api/github/`                         | Q1: generic HTTP; GitHub-specific headers but no domain types               |
| `RepoCard`, `RepoStats`                             | `entities/repo/ui/`                          | Q2: how a repo looks                                                        |
| `useRepository`, `repoKeys`, `seedRepoDetail`       | `entities/repo/queries/`                     | Q2: how a repo is fetched and cached                                        |
| Repo response schema + mapper                       | `entities/repo/api/`, `entities/repo/model/` | Q2                                                                          |
| `OwnerCard`, `useOwner`                             | `entities/owner/…`                           | Q2 (separate noun; repo keeps its own minimal `RepoOwnerRef`)               |
| `SearchBar`, `useRepoSearch`, recent searches store | `features/search-repos/…`                    | Q3: the user searches                                                       |
| `SaveToggle`, saved snapshots store                 | `features/save-repo/…`                       | Q3: the user saves                                                          |
| Open on GitHub / Share / Copy                       | `features/repo-actions/ui/`                  | Q3                                                                          |
| `ThemeSelector`                                     | `features/switch-theme/ui/`                  | Q3; the preference **store** is in `shared/theme` (app-wide infrastructure) |
| `useRepoDetailsView` (live data + snapshot)         | `screens/repo-details/`                      | Q4: combines an entity and a feature                                        |
| "Clear all data" in Settings                        | `screens/settings/`                          | Q4: coordinates several features' public APIs                               |
| Query client, navigator, providers                  | `app/`                                       | Q5                                                                          |

## Tricky cases

- **"Used by two screens" doesn't mean `shared`.** If it knows about repos, it's an entity or a feature.
- **A hook needing two features** belongs in the screen layer.
- **An entity component that must show a feature's control** (e.g. `SaveToggle` on `RepoCard`): give the entity component a slot prop (`accessory`); the screen fills it. The entity never imports the feature.
- **A generic network helper** (e.g. `fetchAsDataUri`): `shared/api`, the only place `fetch` is allowed.
- **Language colours:** `entities/repo/lib`. It's domain knowledge about repos, not a theme token.
- **Icons:** always through `shared/ui/Icon`; never import `@react-native-vector-icons/*` directly (lint-enforced).
- **Rate-limit store:** `shared/api/github`. It's about HTTP headers, not the repo domain.
- **Offline banner:** `shared/ui` component fed by NetInfo from `shared`; generic.
- **An entity that seems to need another entity** (repo → owner): keep a minimal reference type in the first entity; the screen composes the full one.
- **Can't decide between entity and feature?** A noun is an entity; a verb is a feature. If still unsure, prefer the lower layer (entity) and let the screen compose it.

## Don'ts

- Don't create new segment names, nested barrels or per-component folders.
- Don't put styles in `.tsx` files.
- Don't export internals "just in case": knip flags unused exports.
- If a rule needs to change, don't work around it. Propose a superseding ADR (`adr-new` skill).
