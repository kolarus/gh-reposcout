# Architecture Decision Records

Binding decisions for RepoScout. Process: [ADR-0001](0001-record-architecture-decisions.md). New ADR: copy [template.md](template.md) (or use the `adr-new` skill), take the next number, add a row here.

Start with **[0005 — structure](0005-layered-feature-sliced-structure.md)** and **[0022 — enforcement](0022-architecture-enforcement.md)**.

| #                                                | Decision                                                                                            | Status   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)    | Record architecture decisions                                                                       | accepted |
| [0002](0002-bare-react-native-cli.md)            | Bare React Native CLI with the official TypeScript template                                         | accepted |
| [0003](0003-yarn-4-package-manager.md)           | Yarn 4 via corepack, node-modules linker                                                            | accepted |
| [0004](0004-strict-typescript.md)                | Strict TypeScript and typing conventions                                                            | accepted |
| [0005](0005-layered-feature-sliced-structure.md) | Layered feature-sliced project structure                                                            | accepted |
| [0006](0006-navigation.md)                       | React Navigation v7: static config, tabs + native stack, ID-only params                             | accepted |
| [0007](0007-server-and-client-state.md)          | TanStack Query for server state, Zustand for client state                                           | accepted |
| [0008](0008-api-client-and-validation.md)        | Typed fetch client, Zod validation at the boundary, mapping API data to domain types                | accepted |
| [0009](0009-lists-and-images.md)                 | FlashList v2 for lists; core Image with server-resized avatars                                      | accepted |
| [0010](0010-styling-theming-animation.md)        | Styling, theming and animation: StyleSheet + ThemeContext + `makeStyles`, core Animated             | accepted |
| [0011](0011-persistence-and-offline.md)          | Persistence and offline: MMKV, persisted query cache, NetInfo                                       | accepted |
| [0012](0012-rate-limits-no-auth.md)              | Handle GitHub rate limits in the app; no authentication, no secrets                                 | accepted |
| [0013](0013-testing-strategy.md)                 | Testing strategy: Jest + React Native Testing Library + MSW; Maestro for end-to-end                 | accepted |
| [0014](0014-react-compiler.md)                   | Adopt React Compiler                                                                                | accepted |
| [0015](0015-linting-formatting-hooks.md)         | Linting, formatting and git hooks                                                                   | accepted |
| [0016](0016-ci-cd-and-release.md)                | CI/CD and release: GitHub Actions, real keystore signing, provenance                                | accepted |
| [0017](0017-performance-measurement.md)          | Performance measurement methodology                                                                 | accepted |
| [0018](0018-error-model.md)                      | Error model: typed `ApiError` union and layered error boundaries                                    | accepted |
| [0019](0019-strings-and-formatting.md)           | Centralised strings and our own formatters (no i18n library yet)                                    | accepted |
| [0020](0020-saved-repos-offline-snapshots.md)    | Saved repos: user-owned offline snapshots, kept separate from the query cache                       | accepted |
| [0021](0021-local-e2e-isolation.md)              | Local end-to-end isolation with dedicated headless devices (Docker rejected)                        | accepted |
| [0022](0022-architecture-enforcement.md)         | Enforce the architecture with automated checks ("fitness functions")                                | accepted |
| [0023](0023-platform-baseline.md)                | Platform baseline: form factor, branding, accessibility floor, Android and iOS production readiness | accepted |
| [0024](0024-contribution-workflow.md)            | Contribution workflow: solo now, ready for contributors                                             | accepted |
