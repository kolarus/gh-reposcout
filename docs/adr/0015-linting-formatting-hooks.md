# 0015. Linting, formatting and git hooks

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0004, ADR-0005, ADR-0022, ADR-0024

## Context

Most of our architecture and typing rules can be checked by a machine (ADR-0022). The tools must understand types, because many rules need type information. Feedback should come in the editor first, then at commit, then in CI.

## Decision

**ESLint 9, flat config (`eslint.config.mjs`).** ESLint 10 exists, but `eslint-plugin-react` and `eslint-plugin-react-native` only support up to 9 (checked 2026-09-26).

- `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, type-aware (project service)
- **Not** `@react-native/eslint-config`: it still uses the legacy config format and a Babel/Flow parser setup, which a TypeScript-only codebase doesn't need. We compose the plugins it wraps directly.
- `eslint-plugin-react`; `eslint-plugin-react-hooks` 7 (`recommended-latest`, including the React Compiler rules, ADR-0014)
- `eslint-plugin-react-native`: `no-inline-styles`, `no-color-literals`. `no-unused-styles` stays off: styles live in a sibling `*.styles.ts`, so the rule would report every style as unused.
- `eslint-plugin-boundaries` 7 for the layers (ADR-0005), through its policy-based `dependencies` rule. Other slices are reachable only through their `index.ts` (`fileInternalPath`).
- `eslint-plugin-import-x` (the flat-config-native fork of `eslint-plugin-import`) with the TypeScript resolver: `no-cycle`, ordering
- `eslint-plugin-check-file` for file and folder naming
- `@tanstack/eslint-plugin-query` `flat/recommended-strict` (stable query keys, no rest-destructuring of query results, and so on)
- Two typescript-eslint rules take options for React Navigation's global type augmentation (`declare global { namespace ReactNavigation { interface RootParamList extends RootStackParamList {} } }`, ADR-0006): `no-namespace` allows declarations, and `no-empty-object-type` allows an empty interface with a single `extends`.
- `eslint-plugin-jest` and `eslint-plugin-testing-library` for test files
- Project rules through `no-restricted-imports` / `no-restricted-syntax`:
  - `FlatList` banned
  - React Native `Image` only in `shared/ui/Avatar`
  - raw `Text` only in `shared/ui`
  - no `react-native/Libraries/*` imports
  - `console` only in `shared/monitoring`
  - `StyleSheet.create` / `makeStyles` only in `*.styles.ts`
  - `fetch` only in `shared/api`
  - `react-native-mmkv` only in `shared/storage`
  - API response schemas (`*.schema.ts`) imported only from a slice's `api/` or `model/` or its `index.ts` (ADR-0008)
  - the `fetch` global only in `shared/api` (`no-restricted-globals`)
  - `@react-native-vector-icons/*` only in `shared/ui/Icon`
  - no user-facing text literals in JSX outside `shared/i18n` and tests (`no-restricted-syntax` on `JSXText`), so copy goes through `strings.ts` (ADR-0019)
  - tests are exempt from the styles and JSX-text restrictions (they aren't components)
  - The restrictions are built by two helpers in `eslint.config.mjs` that take the names of the ones a folder may skip. When nothing is left, a helper returns `'off'` rather than `['error']`: in flat config, a rule set to a bare severity keeps the options of the earlier config, so `['error']` would silently re-apply every restriction.

**Prettier** is the single source of formatting, with `eslint-config-prettier` so the two don't conflict.

**Git hooks (lefthook):**

- `pre-commit`: Prettier + ESLint on staged files, plus `tsc --noEmit` (incremental, whole project, because types cross files).
- `pre-push`: `yarn validate`: typecheck, lint, Prettier check, architecture, docs and version checks, a release Metro bundle for both platforms (ADR-0013), knip, script tests, Jest.
- `commit-msg`: commitlint with Conventional Commits (ADR-0024).

## Alternatives considered

- **Biome.** Much faster, but no equivalent of type-aware typescript-eslint, `boundaries` or the React Compiler rules yet. We'd lose most enforcement.
- **Oxlint alongside ESLint.** Possible speed-up later; not needed at this size.
- **husky + lint-staged.** Works. lefthook is one fast binary with a single config for all hooks.
- **No hooks, CI only.** Slower feedback. Hooks can be skipped locally (`--no-verify`), but CI stays authoritative.

## Consequences

Positive:

- Most rules are enforced in the editor.
- Consistent formatting with no debates.

Negative / accepted costs:

- Type-aware linting is slower. It runs on staged files only before a commit, and in full in CI.

## Enforcement

- CI runs the full `yarn lint` on every push to `main` (ADR-0016).
- The `rn-review` skill covers what lint can't (ADR-0022).

## References

- https://typescript-eslint.io
- https://github.com/javierbrea/eslint-plugin-boundaries
- https://lefthook.dev
