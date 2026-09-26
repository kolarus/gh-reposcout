# 0004. Strict TypeScript and typing conventions

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0002, ADR-0008, ADR-0015

## Context

The brief asks for "TypeScript only (strict mode preferred)" and evaluates "strong typing, no `any`, proper interfaces". The GitHub API returns loosely typed, nullable JSON. Types that merely _claim_ a shape give false confidence.

## Decision

**Compiler.** `tsconfig.json` extends `@react-native/typescript-config` and adds:

```jsonc
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true,
"noImplicitOverride": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
"noPropertyAccessFromIndexSignature": true,
"useUnknownInCatchVariables": true,
"allowJs": false,
"erasableSyntaxOnly": true   // TS ≥ 5.8: no enums, namespaces or parameter properties
```

`verbatimModuleSyntax` is on if Babel is compatible; otherwise it's dropped with a note. Path aliases per layer (ADR-0005).

**TypeScript-only codebase.**

- All app code is `.ts` / `.tsx`.
- The only `.js` allowed:
  - `index.js`, the native entry point. The Gradle plugin and the Xcode bundle phase default to it; changing that means custom native configuration for no benefit.
  - Tool configs that require JS: `babel.config.js`, `metro.config.js`, `jest.config.js`, `react-native.config.js`, `eslint.config.mjs`, `commitlint.config.mjs`. Everything else is `.ts`, `.tsx`, `.mts`, JSON or YAML.
- Repo scripts (`scripts/*.mts`) are TypeScript and run directly with Node 24's built-in type stripping, with no `tsx` or `ts-node`. They have their own `scripts/tsconfig.json` (Node module resolution, Node types), and `yarn typecheck` checks both projects. `erasableSyntaxOnly` guarantees the scripts stay runnable, and it also bans enums across the codebase in favour of union types.
- Checked in Phase 0: `verbatimModuleSyntax` works with React Native's Babel preset, and TypeScript 6.0 supports every flag above.

**Conventions.**

- **Types at the boundary come from runtime schemas.** Response types are inferred from Zod schemas in `api/` only (ADR-0008).
- **Domain types are explicit.** They are written by hand in `model/types.ts`, so API changes can't silently change what the UI relies on.
- **Discriminated unions + `assertNever`** for anything with variants: error kinds, sort options, list item types, view states. Every `switch` must handle every case.
- **No `any`, no `as` casts** (except `as const`), **no non-null `!`**. Prefer `satisfies` for checked literals. Narrow `unknown` explicitly.
- **`@ts-ignore` banned.** `@ts-expect-error` only with a description.
- **Branded types** only where confusion is plausible and cheap to prevent (for example `RepoFullName`).
- **React Native's strict API:** no deep imports. Use the exported instance types (`TextInputInstance`, etc.).
- **Navigation types** are inferred from the static config, with the global `RootParamList` augmented (ADR-0006).

## Alternatives considered

- **Plain `strict` only.** Misses unchecked index access and optional-property mistakes that are common with API data.
- **Types generated from GitHub's OpenAPI spec** (openapi-typescript, Octokit types). Huge type surface, still no runtime guarantee. We validate only the fields we use (ADR-0008).
- **Allowing `as` for convenience.** It's exactly how "strong typing" quietly becomes false.

## Consequences

Positive:

- The compiler catches whole classes of bugs, such as undefined array elements and unhandled variants.
- Types match runtime reality at the network boundary.

Negative / accepted costs:

- More explicit code: narrowing, `assertNever`, occasional helper types.
- Some libraries' types fight `exactOptionalPropertyTypes`. Wrap them locally rather than loosening the global config.

## Enforcement

- `tsc --noEmit` runs in pre-commit and CI.
- typescript-eslint `strictTypeChecked` rules: `no-explicit-any`, `no-unsafe-*`, `no-non-null-assertion`, `consistent-type-assertions` (`as const` only), `ban-ts-comment`, `switch-exhaustiveness-check`.
- `scripts/check-architecture.ts` enforces the JS-file allow-list.

## References

- https://www.typescriptlang.org/tsconfig
- https://typescript-eslint.io/users/configs#strict-type-checked
