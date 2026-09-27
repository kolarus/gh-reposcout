# AGENTS.md

RepoScout: a React Native 0.87 (bare CLI, New Architecture, Hermes) GitHub repository explorer in strict TypeScript. `CLAUDE.md` is a symlink to this file.

## Read before changing code

1. [docs/adr/README.md](docs/adr/README.md): the Architecture Decision Records are **binding**.
2. [ADR-0005](docs/adr/0005-layered-feature-sliced-structure.md): structure and where code goes.
3. [ADR-0022](docs/adr/0022-architecture-enforcement.md): what the tooling will reject.
4. The ADR for the area you touch (table below).

| Area                        | ADR                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| Navigation                  | [0006](docs/adr/0006-navigation.md)                                                                      |
| Data fetching, cache, state | [0007](docs/adr/0007-server-and-client-state.md), [0008](docs/adr/0008-api-client-and-validation.md)     |
| Lists and images            | [0009](docs/adr/0009-lists-and-images.md)                                                                |
| Styling, theming, icons     | [0010](docs/adr/0010-styling-theming-animation.md)                                                       |
| Storage and offline         | [0011](docs/adr/0011-persistence-and-offline.md), [0020](docs/adr/0020-saved-repos-offline-snapshots.md) |
| GitHub rate limits          | [0012](docs/adr/0012-rate-limits-no-auth.md)                                                             |
| Errors                      | [0018](docs/adr/0018-error-model.md)                                                                     |
| Strings and formatting      | [0019](docs/adr/0019-strings-and-formatting.md)                                                          |
| Tests                       | [0013](docs/adr/0013-testing-strategy.md)                                                                |
| CI and releases             | [0016](docs/adr/0016-ci-cd-and-release.md)                                                               |
| Platform baseline           | [0023](docs/adr/0023-platform-baseline.md)                                                               |
| Contributing                | [0024](docs/adr/0024-contribution-workflow.md)                                                           |

## Where code goes (ADR-0005)

Layers import downward only: `app → screens → features → entities → shared`.

1. Would another app use it unchanged? → `src/shared/<segment>`
2. Is it a business _thing_ (data, mapping, how it looks)? → `src/entities/<noun>`
3. Is it something the user _does_? → `src/features/<verb-noun>`
4. Does it combine several of those for one screen? → `src/screens/<screen>`
5. Global setup or wiring? → `src/app`

Run the **`where-does-it-go`** skill before creating a new file. Other slices are imported only through their `index.ts`; slices in the same layer never import each other. When two slices need each other, move the combining code **up** a layer (or pass data in as arguments, or use a slot prop), never sideways.

## Hard rules (most are enforced by lint or scripts)

- **Files:** `X.tsx` + `X.styles.ts` + `X.test.tsx`, side by side. No styles in component files, no inline styles. ([0005](docs/adr/0005-layered-feature-sliced-structure.md), [0010](docs/adr/0010-styling-theming-animation.md))
- **Types:** TypeScript only; no `any`, no `as` (except `as const`), no `!`, no `@ts-ignore`. Unions + `assertNever` instead of enums. ([0004](docs/adr/0004-strict-typescript.md))
- **Data:** API shapes (DTOs) never leave `api/` and `model/`; query keys come from key factories; server data never goes into Zustand. ([0007](docs/adr/0007-server-and-client-state.md), [0008](docs/adr/0008-api-client-and-validation.md))
- **Confined APIs:** `fetch` only in `shared/api`; MMKV only in `shared/storage`; `console` only in `shared/monitoring`; icons only through `shared/ui` Icon; FlashList instead of FlatList; images through `shared/ui` Avatar.
- **Copy and tokens:** user-facing strings from `shared/i18n`; colours and spacing from theme tokens. ([0010](docs/adr/0010-styling-theming-animation.md), [0019](docs/adr/0019-strings-and-formatting.md))
- **No secrets, no tokens** anywhere. ([0012](docs/adr/0012-rate-limits-no-auth.md))
- **Tests don't sleep:** no `setTimeout` or timed MSW `delay(ms)` to wait for something. Use `findBy`/`waitFor`, fake timers, or `createGate()` from `src/test/gate.ts`. ([0013](docs/adr/0013-testing-strategy.md))
- **Suppressions:** every `eslint-disable` names the rule and explains why.

## Workflow

- Before creating a file: run the `where-does-it-go` skill.
- Before declaring work done: `yarn validate` must pass (the same command runs in the pre-push hook and CI).
- At the end of each phase and before a release: run the `rn-review` skill (added in Phase 5).
- **Agents never commit, push or tag**, and never add AI attribution trailers. Prepare the change, run the checks, and propose a Conventional Commit message; the owner commits. ([0024](docs/adr/0024-contribution-workflow.md))
- If a change would contradict an ADR: stop and write a superseding ADR first (the `adr-new` skill scaffolds it). Any other new decision goes into an ADR, a README note or a code comment, per [ADR-0001](docs/adr/0001-record-architecture-decisions.md).
- Comments: TSDoc on each slice's public API; _why_-comments on non-obvious code; no comments that restate code.

## Commands

`yarn android` · `yarn android:release` · `yarn ios` · `yarn start` · `yarn validate` · `yarn test` · `yarn lint` · `yarn typecheck` · `yarn check:architecture` · `yarn check:docs` · `yarn check:version` · `yarn check:bundle` · `yarn arch:graph` · `yarn release:prepare <x.y.z>`
