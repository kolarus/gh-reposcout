# 0005. Layered feature-sliced project structure

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0010 (styling), ADR-0020 (saved repos), ADR-0022 (enforcement)

## Context

The app starts small (four screens: Search, Repository details, Saved, Settings), but the brief asks for a structure that "scales to millions of users". In practice that means it must scale to **many features and many engineers** working in parallel without the codebase turning into a tangle.

Forces:

- The same business objects show up on several screens. A repository card appears in Search results and in the Saved list. Repository data and the "save" action are both needed on Search and on Details.
- The Details screen combines live API data with a locally saved snapshot (offline support).
- Reviewers should understand what the app does by opening the source tree.
- Rules nobody enforces decay, so boundaries have to be checkable by tooling, not just documented.

An earlier draft of this plan used a flat `app → features → shared` split. Reviewing it showed the Saved feature needed the Search feature's list row, and Search and Details needed Saved's toggle. That forced a documented "allowed cross-feature import" exception, which is exactly the coupling a feature structure is meant to prevent.

## Decision

Organise `src/` into five layers, adapted from [Feature-Sliced Design](https://feature-sliced.design/) (FSD), with strict top-down imports:

```
app → screens → features → entities → shared
```

| Layer      | Holds                                                                   | Examples                                                    |
| ---------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `app`      | Wiring only: providers, navigation, query client, global error handlers | `RootNavigator`, `queryClient`                              |
| `screens`  | Composition of one screen from features and entities; no domain logic   | `SearchScreen`, `RepoDetailsScreen` + `useRepoDetailsView`  |
| `features` | Things the user _does_ (verbs)                                          | `search-repos`, `save-repo`, `repo-actions`, `switch-theme` |
| `entities` | Business _things_: their data, mapping, query hooks and presentation    | `repo` (`RepoCard`, `useRepository`), `owner`               |
| `shared`   | Domain-agnostic code that could move to another app unchanged           | API client, UI primitives, theme, storage, formatters       |

Rules:

1. A layer imports only from layers **below** it. Slices in the same layer never import each other (`features/*` ↛ `features/*`, `entities/*` ↛ `entities/*`).
2. Each slice exposes a **public API** through a single `index.ts`. Other slices never deep-import its internals. Inside a slice, imports are relative.
3. There is **one barrel per slice and no nested barrels**, and `import/no-cycle` is on.
4. When two slices need each other, the need is solved **by moving up, never sideways**. The layer above composes them, or one slice receives the other's data as arguments.
   - **Slots are the UI version of this.** Entity components expose slots for things they must not know about. Example: `RepoCard` has an `accessory` prop, and `screens/search` puts the `SaveToggle` (from `features/save-repo`) into it. Neither slice imports the other.
5. The rules are enforced with `eslint-plugin-boundaries` in CI; a violation fails the build.

The FSD layers `widgets` and `processes` are deliberately left out; they add ceremony without benefit at this size. `screens` plays the role of FSD's `pages`, renamed to match React Native vocabulary.

### Component file convention

Components are flat and colocated under the same base name, with no per-component folders and no barrels:

```
RepoCard.tsx          structure and behaviour only
RepoCard.styles.ts    all styles (makeStyles / StyleSheet.create)
RepoCard.test.tsx     tests, when warranted
```

Lint enforces this: `StyleSheet.create` / `makeStyles` are allowed only in `*.styles.ts` files (and in `shared/theme`), and `react-native/no-inline-styles` is an error. The only allowed inline values are dynamic ones computed from props or state (`[styles.bar, { width }]`). Details on theming are in ADR-0010.

### Placement guide (also in AGENTS.md, and runnable as the `where-does-it-go` skill)

1. Would another app use it unchanged? → `shared`
2. Is it a business _thing_ (data, mapping, how it looks)? → `entities`
3. Is it something the user _does_? → `features`
4. Does it combine several of those for one screen? → `screens`
5. Is it global setup or wiring? → `app`

## Alternatives considered

- **Type-based folders** (`components/`, `screens/`, `hooks/`, `services/`, `store/`), the classic React Native layout. It's simple for small apps. As an app grows, one feature spreads across five folders, ownership is unclear, and nothing prevents any file importing any other. Rejected: doesn't scale to many teams.
- **Flat feature folders** (`app → features → shared`), the earlier draft of this plan. It's close, but it has nowhere to put business objects shared by several features, so features end up importing each other. Rejected for the coupling described in Context.
- **Full Feature-Sliced Design** (seven layers, including `widgets` and `processes`). It's the most rigorous, but it's overkill for four screens and tends to cause debates about which layer something belongs in. Rejected for now; the chosen layout can grow into it.
- **Clean or hexagonal architecture** (domain, use cases, repositories, adapters). The layering it offers is heavier than a React Native client needs; TanStack Query already acts as the repository and cache. We keep its useful idea, interfaces at real seams (an injectable `fetch`, a monitoring interface, a storage adapter), without the full ceremony. Rejected as a whole, adopted in part.
- **Monorepo packages** (`packages/feature-*`). Premature for one app. Each slice here maps 1:1 onto a future package, so a later split is mechanical.

## Consequences

Positive:

- Opening `src/features` and `src/entities` shows what the app does and what it works with.
- Features can be added, owned (for example with CODEOWNERS per slice) and deleted independently.
- Dependency direction is checked on every commit, so the structure can't quietly erode.
- Shared business objects (`entities/repo`) have one obvious home, which removes duplicated list rows and mappers.
- Moving to a monorepo later is mechanical.

Negative / accepted costs:

- There are more folders and more indirection than four screens strictly need. We accept this because the brief is about scaling.
- Deciding whether something is an entity or a feature can be ambiguous at first. The placement guide above keeps it to a quick decision.
- Barrel files can slow startup and cause import cycles. We mitigate that with one barrel per slice, no nested barrels, `import/no-cycle`, and Metro inline requires.
- Every component has a separate styles file, so there are two files per component. We accept this in exchange for consistency and lint enforcement.

Follow-ups:

- Configure `eslint-plugin-boundaries` element types and rules for the five layers in Phase 0.
- Add the path aliases `@/app`, `@/screens/*`, `@/features/*`, `@/entities/*` and `@/shared/*` to both TypeScript and Babel.
- Copy the placement guide into AGENTS.md. Ship the `where-does-it-go` skill (`.claude/skills/`), which applies it step by step with worked examples from this codebase and can scaffold correctly named files.
- Have the `rn-review` skill check for layer-rule evasions that lint can't see, such as re-exports through `shared` or dependencies smuggled in as props.

## Enforcement

- `eslint-plugin-boundaries`: layer direction, no imports between slices in the same layer, and imports only through a slice's `index.ts`.
- `import/no-cycle`.
- Styles: `StyleSheet.create` / `makeStyles` only in `*.styles.ts`, and `react-native/no-inline-styles`.
- `eslint-plugin-check-file`: folder and file naming.
- `scripts/check-architecture.ts` checks that:
  - every slice has an `index.ts`
  - every `X.styles.ts` has a matching `X.tsx`
  - there are no nested barrels
  - slices use only the known subfolder names
- dependency-cruiser generates the architecture graph for the README.
- The `rn-review` skill catches workarounds lint can't see: re-exports through `shared`, dependencies passed in as props, domain logic in `shared` or `screens`.

## References

- Feature-Sliced Design: https://feature-sliced.design/
- Robert C. Martin, "Screaming Architecture"
