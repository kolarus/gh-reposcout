# 0022. Enforce the architecture with automated checks ("fitness functions")

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0001, ADR-0004, ADR-0005, ADR-0015, ADR-0016

## Context

Architecture documented only in prose decays: under deadline pressure people (and coding agents) take shortcuts, and nobody notices until the structure has eroded. The project will be extended far beyond this assignment by many contributors, including AI agents. Any rule a machine can check should be checked by a machine; the rest should be explicit and discoverable.

## Decision

Rules are checked in layers, from fastest feedback to slowest:

| #   | Mechanism                                                     | Runs                                | Enforces                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | TypeScript (strict, `allowJs: false`, path aliases per layer) | editor, pre-commit, CI              | types, TS-only, no deep React Native imports                                                                                                                                                                                    |
| 2   | `eslint-plugin-boundaries`                                    | editor, pre-commit, CI              | layer direction, no imports between slices in the same layer, imports only through `index.ts` (ADR-0005)                                                                                                                        |
| 3   | ESLint rule set (ADR-0015)                                    | editor, pre-commit, CI              | cycles, banned imports, styles only in `*.styles.ts`, no inline styles, no `any` / `as` / `!`, query rules, `console` / `fetch` / MMKV confined to their homes                                                                  |
| 4   | `eslint-plugin-check-file`                                    | editor, CI                          | naming: kebab-case folders, PascalCase components, `useX` hooks, `X.styles.ts`, `X.test.tsx`                                                                                                                                    |
| 5   | `scripts/check-architecture.mts`                              | pre-push, CI                        | every slice has `index.ts`; every `X.styles.ts` has a matching `X.tsx`; no nested barrels; known subfolder names only; JS-file allow-list; no empty slices                                                                      |
| 6   | `scripts/check-docs.mts`                                      | pre-push, CI                        | ADR numbering, status and index; "superseded by" targets exist; every relative link in README, AGENTS.md and ADRs resolves                                                                                                      |
| 7   | knip (`knip.jsonc`)                                           | pre-push, CI                        | unused files, exports and dependencies (keeps each slice's public API small)                                                                                                                                                    |
| 8   | dependency-cruiser                                            | `yarn arch:graph`                   | generates `docs/architecture-graph.md`, a slice-level Mermaid graph from the real imports (GitHub renders Mermaid, so no Graphviz is needed). A CI check that the committed graph is up to date is in the improvements backlog. |
| 9   | Tests as guards                                               | pre-push, CI                        | behaviour promised in ADRs (view-resolution table, error kinds, pagination limits, formatters)                                                                                                                                  |
| 10  | CI on every push to `main`                                    | push                                | a red run is fixed before anything else; no PRs or branch protection (ADR-0024)                                                                                                                                                 |
| 11  | `rn-review` skill                                             | end of each phase, before a release | rules lint can't see (see below)                                                                                                                                                                                                |
| 12  | AGENTS.md                                                     | every agent session                 | reading order, hard rules, links to ADRs                                                                                                                                                                                        |

- **`yarn validate`** runs 1–7 and 9, plus `check:version` (ADR-0016) and the Prettier check. The check scripts have their own tests (`yarn test:scripts`, Node's `node:test`). It's the same command locally, in the pre-push hook and in CI.
- **Proof:** in Phase 0, deliberate violations (a feature importing another feature, an inline style, a missing `index.ts`, and more) are added temporarily, and `yarn validate` must fail on each. They're reverted and never committed. The README shows the resulting lint output as a short text snippet.

**Covered by review rather than tooling** (checked by the `rn-review` skill):

- ways around the layer rules: re-exports through `shared`, dependencies passed in as props, domain logic in `shared` or `screens`
- entity versus feature misclassification
- performance smells: unstable row props, variable-height rows, expensive work in render
- missing loading, empty, error or offline states
- decisions made in code without an ADR, README note or comment

## Alternatives considered

- **Documentation only.** Decays; agents and new contributors miss it.
- **Code review only.** Inconsistent and slow; humans miss mechanical violations.
- **Nx module-boundary rules.** Needs Nx and a monorepo (premature).
- **dependency-cruiser alone** for boundaries. Works in CI, but gives no feedback in the editor. We use `boundaries` for the editor and dependency-cruiser for the graph.

## Consequences

Positive:

- Architecture violations are caught in seconds, usually in the editor.
- The README's architecture diagram is generated from the real code (refreshed manually for now).
- Agents get immediate, specific feedback.

Negative / accepted costs:

- Custom scripts to maintain (small, and covered by their own tests).
- Occasional friction when a rule is wrong. The fix is to change the rule through an ADR, not to add suppressions.
- Nothing technically stops a broken commit from reaching `main`, because there are no PRs or branch protection (ADR-0024). The pre-push hook catches most problems first, and a red CI run is fixed immediately. A PR workflow with branch protection is in the improvements backlog for when there's a team.

## Enforcement

This ADR is self-enforcing through the checks above. Rule suppressions (`eslint-disable`) must name the rule and give a reason (`eslint-comments/require-description`), and they're reviewed.

## References

- Ford, Parsons, Kua, "Building Evolutionary Architectures" (fitness functions)
- https://github.com/javierbrea/eslint-plugin-boundaries
- https://knip.dev
- https://github.com/sverweij/dependency-cruiser
