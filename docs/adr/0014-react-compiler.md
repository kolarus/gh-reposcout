# 0014. Adopt React Compiler

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0009, ADR-0017

## Context

Smooth lists depend on avoiding unnecessary re-renders. Manual `useMemo`, `useCallback` and `React.memo` are noisy, easy to get wrong (a missed dependency), and easy to forget. React Compiler (stable 1.0 since October 2025) memoises components and values automatically at build time, for code that follows the Rules of React.

## Decision

- Enable `babel-plugin-react-compiler` for all app code.
- Enable the React Compiler lint rules (through `eslint-plugin-react-hooks`), so code that would stop the compiler from optimising is reported.
- **Don't write manual `useMemo` / `useCallback` / `React.memo`** unless profiling shows the compiler didn't cover a case. When a manual one is added, comment why.
- `"use no memo"` is allowed only as a documented, temporary escape hatch that links an issue.
- Verify in React Native DevTools: optimised components show the compiler badge. Include a screenshot in the performance section (ADR-0017).

## Alternatives considered

- **Manual memoisation only.** Proven, but verbose and error-prone. Reviewers spend attention on dependency arrays instead of logic.
- **No memoisation.** Risks dropped frames in the list when parents re-render.

## Consequences

Positive:

- Less code, fewer memoisation bugs, and good performance by default.

Negative / accepted costs:

- Build-time transform: a new toolchain piece to understand and debug.
- Code must follow the Rules of React strictly, which is good practice anyway.
- Some third-party patterns may opt out. Lint surfaces them.

## Enforcement

- React Compiler lint rules at error level.
- The `rn-review` skill flags manual memoisation without a justification comment.
- DevTools verification recorded in the README.

## References

- https://react.dev/learn/react-compiler
