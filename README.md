# RepoScout

A cross-platform (iOS + Android) GitHub repository explorer built with React Native 0.87 and TypeScript: search repositories, browse results, open details, and save repos for offline viewing.

> 🚧 **Work in progress.** The foundation (tooling, architecture rules, CI, decision records) is in place; features land phase by phase. Sections below marked _(coming)_ are filled in as they're built.

## Quick start

**Prerequisites**

- Node 24 LTS (`.nvmrc`; at least 22.18, because the repo scripts are TypeScript run directly by Node; `nvm use` picks it up) and Yarn through corepack: `corepack enable` (Node 25+ ships without corepack: `npm i -g corepack`)
- Android: JDK 17, Android Studio with SDK platform 37 and build-tools 37
- iOS: Xcode 26+, Ruby 3.x with Bundler (CocoaPods comes from the `Gemfile`)
- Watchman (recommended)

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

## Testing _(coming)_

## What I'd improve with more time _(coming)_

## Project conventions

- Agents (and humans) start at [AGENTS.md](AGENTS.md).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org), checked by commitlint; `yarn validate` runs before every push ([ADR-0024](docs/adr/0024-contribution-workflow.md)).

---

MIT licensed. Not affiliated with or endorsed by GitHub, Inc.
