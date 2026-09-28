---
name: rn-review
description: Review RepoScout code for the problems lint, types and tests can't catch (layer-rule evasions, performance smells, missing UI states, accessibility, docs drift), against the binding ADRs. Use at the end of each phase, before a release, when reviewing a diff, or when the user asks for a review. Outputs verified findings with file:line, severity and a fix.
---

# rn-review

Reviews code against the **binding ADRs** (`docs/adr/`), covering what tooling can't see (ADR-0022, "covered by review rather than tooling"). Humans and agents review against this same checklist (ADR-0024).

## Scope

- **Change** (default): the current branch and working tree, `git diff main...HEAD` plus `git status`.
- **Full** (end of a phase, before a release): everything under `src/`, plus `android/`, `ios/`, `scripts/` and the docs.

## Ground rules

1. **Start from green.** Run `yarn validate` first. Don't report what it already enforces: TypeScript strictness, ESLint (layer boundaries, confined APIs, `no-restricted-*`, a11y lint rules), formatting, `check:architecture`, `check:docs`, `check:version`, knip.
2. **Every finding cites a rule**: an ADR, AGENTS.md, or a real bug. If code and an ADR disagree, that is the finding; the fix is the code, or a superseding ADR (`adr-new`).
3. **Verify before reporting.** Read the code, its caller and its test. If you can't point at a line and say what goes wrong for the user or the next developer, drop it. Fewer, real findings beat a long list.
4. **Severity:**
   - **blocker**: crash, data loss, security, or a shipped ADR violation.
   - **major**: a user-visible defect, a missing loading/empty/error/offline state, a performance smell on a hot path (rows, startup, typing).
   - **minor**: maintainability, docs drift, a missing test.
   - **nit**: wording, naming.

## Checklist

Each item names its ADR and where to look. Search hints are starting points; confirm by reading.

**Architecture (ADR-0005, ADR-0022)**

- Ways around the layer rules: `shared` re-exporting a slice; a feature's hook or function passed down as a prop to reach sideways (a _rendered element_ in a slot prop is fine); domain logic (repos, owners, GitHub rules beyond HTTP) in `shared`; business rules in `screens` that belong in an entity or feature.
- Noun/verb misclassification: an entity that is really a user action, or the reverse.
- Fetching or business logic in navigator config or UI components instead of slice hooks.

**Server and client state (ADR-0007, ADR-0011)**

- Query keys built inline instead of from a key factory; params missing from a key. Search: `queryKey:` outside `queries/`.
- Server data copied into Zustand; whole-store subscriptions (`useX()` or `useX(s => s)`).
- `useEffect` deriving state, or syncing server data into a store.

**API and errors (ADR-0008, ADR-0012, ADR-0018)**

- DTO types or snake_case fields past `api/` and `model/`. Search: `_url`, `_count`, `_at`, `full_name` in `ui/`, `screens/`.
- New eager fetches (on mount without the user asking); retries of errors that must not be retried (rate limits, 4xx).
- A `switch` on an error kind without `assertNever`; generic "Something went wrong" copy where a typed kind exists.
- Races: a request without the query's `signal`; a stale closure in a debounced or delayed callback.
- URLs from the API opened without `safeUrl` (ADR-0008).

**UI states (ADR-0018, ADR-0020)**

- New async UI without loading, empty, error and offline states; a state that flashes (skeleton after cached data, spinner for a cached screen).

**Lists and images (ADR-0009)**

- Row props recreated per render where the compiler can't help (inline objects or arrays built in `renderItem`).
- Rows whose height depends on async content, or unclamped text in a row.
- Images not through `Avatar`, without a fixed size, or not requesting a resized source; a recycled cell showing the previous image.

**Rendering (ADR-0014, ADR-0019)**

- Manual `useMemo`, `useCallback` or `memo` without a comment saying why the compiler isn't enough.
- `new Intl.*` in a component, render path or row (formatters live at module level in `shared/lib`).
- Expensive work in render (sorting or filtering large arrays) instead of a query `select`.
- Context values created inline; heavy imports added to the startup path (`App`, the navigator, `SearchScreen`).

**Styling (ADR-0010)**

- Hard-coded colours, spacing, radii or sizes in `*.styles.ts` instead of theme tokens; dynamic styles that could be static variants; styles built per render outside `makeStyles`.

**Navigation (ADR-0006)**

- Objects passed as navigation params (only ids and short strings); deep links without a sensible back stack.

**Accessibility and copy (ADR-0019, ADR-0023)**

- Pressables without role and label; icon-only buttons without a label; colour as the only signal; touch targets below 44 pt / 48 dp; state changes not announced (loading, errors).
- User-facing strings not from `shared/i18n`; plural or number formatting done by hand.

**Tests (ADR-0013)**

- New mappers, hooks or stores without tests; tests asserting implementation details (internal state, call order) instead of what the user sees or what the network got; waits built on time instead of `findBy` / `waitFor` / `createGate()`.

**Types (ADR-0004)**

- Types widened to `string` or `unknown` where a union exists; optional fields that are really required; unchecked `JSON.parse` results.

**Native and platform (ADR-0002, ADR-0023)**

- A new native dependency without the admission rule (New Architecture support, maintained, config done on both platforms); permissions added without need; `android/` or `ios/` changes without a comment; release settings (debuggable, profileable, R8 keep rules for reflection).

**Docs (ADR-0001, ADR-0024)**

- A decision made in code without an ADR, README note or comment; an ADR the code contradicts; README or AGENTS.md commands out of date; comments that restate the code; slice public API without TSDoc.

## How to run a full review

1. `yarn validate` (must pass).
2. Read each slice's `index.ts` first (its public API), then the files layer by layer from the bottom: `shared` → `entities` → `features` → `screens` → `app`. Then native changes, scripts and docs.
3. Keep notes per checklist area, including areas where nothing was found.

## Output

1. **Findings**, most severe first. Each one: severity, `file:line`, rule (ADR), what goes wrong, suggested fix.
2. **Checked, nothing found**: the checklist areas that came up clean, so the reader knows they were looked at.
3. **Needs a decision**: findings whose fix would change an ADR or a product behaviour; these go to the owner.

After the review, fix blockers and majors, or move each one to `internal_docs/08-improvements-backlog.md` with a reason. Then run `yarn validate` again.
