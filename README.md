# RepoScout

A cross-platform (iOS + Android) GitHub repository explorer built with React Native 0.87 and TypeScript: search repositories, browse results, open details, and save repos for offline viewing.

> 🚧 **Work in progress.** The foundation (tooling, architecture rules, CI, decision records) is in place; features land phase by phase. Sections below marked _(coming)_ are filled in as they're built.

## Quick start

**Prerequisites**

- Node 24 LTS (`.nvmrc`; at least 22.18, because the repo scripts are TypeScript run directly by Node; `nvm use` picks it up) and Yarn through corepack: `corepack enable` (Node 25+ ships without corepack: `npm i -g corepack`)
- Android: JDK 17, Android Studio with SDK platform 37 and build-tools 37
- iOS: Xcode 26+, Ruby 3.x with Bundler (CocoaPods comes from the `Gemfile`)
- Watchman (recommended)
- End-to-end tests only: [Maestro](https://maestro.mobile.dev) 2.10.0 in `~/.maestro` (or set `MAESTRO` to its path), then `yarn e2e:setup`

**Run**

```sh
yarn install
yarn android   # or: yarn ios
```

`yarn ios` installs CocoaPods automatically when native dependencies change (through Bundler); `yarn pods` does it manually. `yarn android` builds only for the connected device's CPU type to keep debug builds fast. Debug builds install as **RepoScout Dev** (`com.bohdanmorozov.reposcout.debug`), next to a release build.

<details>
<summary>Troubleshooting</summary>

- **Metro: Watchman "Operation not permitted"** in a folder under `~/Documents`: macOS privacy protection on the Watchman service. Run `watchman shutdown-server` and start Metro again from your terminal.

</details>

## Scripts

| Command                                                              | What it does                                                                                                                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn android` / `yarn ios`                                          | Build and run the debug app                                                                                                                                                        |
| `yarn android:release`                                               | Build, install and launch the release variant (JS bundled in, no Metro; signed with the debug key unless the upload key is set up, [ADR-0016](docs/adr/0016-ci-cd-and-release.md)) |
| `yarn start`                                                         | Start Metro                                                                                                                                                                        |
| `yarn validate`                                                      | Everything CI checks: typecheck, lint, formatting, architecture/docs/version checks, release bundle, knip, script tests, Jest                                                      |
| `yarn test`                                                          | Jest (app) · `yarn test:scripts` for the repo scripts                                                                                                                              |
| `yarn lint` · `yarn typecheck` · `yarn format`                       | Individual checks / formatting                                                                                                                                                     |
| `yarn check:architecture` · `yarn check:docs` · `yarn check:version` | Structural, documentation and version checks ([ADR-0022](docs/adr/0022-architecture-enforcement.md))                                                                               |
| `yarn check:bundle`                                                  | Release Metro bundle for Android and iOS: catches build problems Jest can't ([ADR-0013](docs/adr/0013-testing-strategy.md))                                                        |
| `yarn e2e:setup`                                                     | Create the dedicated end-to-end emulator and simulator (once; [ADR-0021](docs/adr/0021-local-e2e-isolation.md))                                                                    |
| `yarn e2e:android` / `yarn e2e:ios`                                  | Boot the test device headless, install the release build, run the Maestro flows, shut down (`--keep-alive`, `--headed`)                                                            |
| `yarn e2e:record <platform>`                                         | The same flows, one screen recording per flow (README demo videos)                                                                                                                 |
| `yarn brand:generate`                                                | Regenerate app icons and the launch screen from `assets/brand/*.svg` ([ADR-0023](docs/adr/0023-platform-baseline.md))                                                              |
| `yarn arch:graph`                                                    | Regenerate the [architecture graph](docs/architecture-graph.md) from the real imports                                                                                              |
| `yarn release:prepare <x.y.z>`                                       | Set the app version everywhere ([ADR-0016](docs/adr/0016-ci-cd-and-release.md))                                                                                                    |
| `yarn pods`                                                          | Install CocoaPods manually                                                                                                                                                         |

## Architecture

Five layers with one-way imports, checked by lint on every commit ([ADR-0005](docs/adr/0005-layered-feature-sliced-structure.md)):

```
app → screens → features → entities → shared
```

- **shared**: building blocks with no knowledge of GitHub repos (UI kit, theme, API client, storage)
- **entities**: the nouns: a repo, an owner (data, mapping, how they look)
- **features**: the verbs: search repos, save a repo, repo actions, switch theme
- **screens**: compose features and entities into screens
- **app**: providers, navigation, wiring

A slice is only reachable through its `index.ts`, slices in the same layer never import each other, and every component keeps its styles in a sibling `X.styles.ts`. Architecture rules are enforced by tooling, not just documented ([ADR-0022](docs/adr/0022-architecture-enforcement.md)).

## Key decisions

All decisions are recorded as [Architecture Decision Records](docs/adr/README.md). Highlights:

| Area           | Choice                                                              | Why                                                                                                                               |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | Bare React Native CLI 0.87, New Architecture, Hermes                | Full ownership of native projects ([ADR-0002](docs/adr/0002-bare-react-native-cli.md))                                            |
| Structure      | Layered feature slices with lint-enforced boundaries                | Scales to many features and engineers ([ADR-0005](docs/adr/0005-layered-feature-sliced-structure.md))                             |
| Typing         | Strictest TypeScript, no `any`/`as`/`!`, runtime-validated API data | Types that match reality ([ADR-0004](docs/adr/0004-strict-typescript.md), [ADR-0008](docs/adr/0008-api-client-and-validation.md)) |
| Data           | TanStack Query for server state, Zustand for client state           | [ADR-0007](docs/adr/0007-server-and-client-state.md)                                                                              |
| Lists & images | FlashList v2, core `Image` with server-resized avatars              | [ADR-0009](docs/adr/0009-lists-and-images.md)                                                                                     |
| GitHub limits  | No auth, no secrets; rate limits handled in the UX                  | [ADR-0012](docs/adr/0012-rate-limits-no-auth.md)                                                                                  |
| Testing        | Jest + React Native Testing Library + MSW; Maestro end-to-end       | [ADR-0013](docs/adr/0013-testing-strategy.md)                                                                                     |

## Features _(coming)_

## Performance _(coming)_

## Testing

Unit and integration tests use Jest, React Native Testing Library and MSW, and run in `yarn validate` before every push and in CI ([ADR-0013](docs/adr/0013-testing-strategy.md)).

### End-to-end (Maestro)

[![E2E](https://github.com/kolarus/gh-reposcout/actions/workflows/e2e.yml/badge.svg)](https://github.com/kolarus/gh-reposcout/actions/workflows/e2e.yml)

Three [Maestro](https://maestro.mobile.dev) flows drive the **release** build like a user would:

| Flow                     | What it proves                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `search-to-details`      | Search, scroll the results, open a repository, go back to Search                        |
| `theme`                  | Switch to dark mode, restart the app: still selected; back to the system setting        |
| `save-offline` (Android) | Save a repository, turn on airplane mode, open it from Saved: the offline copy is shown |

- **In CI** ([`e2e.yml`](.github/workflows/e2e.yml)), nightly and on demand, on an Android 16 emulator with 16 KB memory pages, so every run also proves the app works on 16 KB-page devices ([ADR-0023](docs/adr/0023-platform-baseline.md)). Each run keeps its JUnit report, plus a screenshot and the view hierarchy of any failed step, as a downloadable artifact.
- **Locally**, `yarn e2e:setup` once, then `yarn e2e:android` or `yarn e2e:ios`: a dedicated headless emulator or simulator boots, runs the flows and shuts down ([ADR-0021](docs/adr/0021-local-e2e-isolation.md)). iOS runs the first two flows (the simulator has no airplane mode).
- The flows use the live GitHub API, so they check structure ("results appear", "the first row opens Details"), never specific repositories. For the same reason CI runs them nightly instead of on every push, and the local script retries a failed flow once.

## What I'd improve with more time _(coming)_

## Project conventions

- Agents (and humans) start at [AGENTS.md](AGENTS.md).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org), checked by commitlint; `yarn validate` runs before every push ([ADR-0024](docs/adr/0024-contribution-workflow.md)).

---

MIT licensed. Not affiliated with or endorsed by GitHub, Inc.
