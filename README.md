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
| `yarn perf:android`                                                  | Measure the release build on the test emulator: size, cold start, scrolling, memory ([ADR-0017](docs/adr/0017-performance-measurement.md))                                         |
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

## Performance

Measured on the **release build** on the dedicated Android emulator, by a script anyone can re-run: `yarn perf:android` ([ADR-0017](docs/adr/0017-performance-measurement.md)). Emulator numbers are relative evidence, not a claim about a particular phone (see the caveats below).

| The brief asks for | Result (release build, 28 Sep 2026)                                                                                                                                                                                                                                                                                                                                                      | Screenshot                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 60 FPS scrolling   | **1.0% janky frames** (30 of 2,985) and no slow UI-thread frames, flinging through all 1,000 results of a search while nine more pages load                                                                                                                                                                                                                                              | [GPU bars](docs/media/perf/scroll-gpu-bars.png) (release) · [Perf Monitor](docs/media/perf/scroll-perf-monitor.png) (debug: 58–60 fps) |
| Fast startup       | **97 ms** to the first frame, median of 10 cold starts                                                                                                                                                                                                                                                                                                                                   | [Startup trace](docs/media/perf/startup-trace.png) (release, traced)                                                                   |
| Low memory         | **104 → 171 MB** PSS on the test emulator (`dumpsys meminfo`) after scrolling all 1,000 results, 157 MB once in the background. Rows are recycled (228 → 267 views) and decoded images evicted (261 bitmaps). Repeating the search stays flat (169 MB after each clear); only the 5 most recent searches stay in memory (before that cap, each new 1,000-result search added about 6 MB) | [Memory timeline](docs/media/perf/memory-timeline.png) (release)                                                                       |

Supporting evidence:

- **Render cost** (debug build: the shape of the work, not its speed): the [React Native DevTools Performance panel](docs/media/perf/devtools-profiler.png) shows a sort change re-rendering only the rows on screen, and the [React Compiler badges](docs/media/perf/compiler-badges.png) show the components it memoises.
- **Network:** the GitHub requests of a scripted session, counted exactly by a Jest test against MSW that runs in CI ("GitHub requests in a scripted session", [`App.test.tsx`](src/app/App.test.tsx)):

  | Step                                                          | Requests                                                             |
  | ------------------------------------------------------------- | -------------------------------------------------------------------- |
  | Type "react native", a keystroke every 150 ms (12 keystrokes) | 1 search                                                             |
  | Sort by Most stars                                            | 1 search                                                             |
  | Back to Best match                                            | none: cached                                                         |
  | Clear the field, type "react native" again                    | none: cached                                                         |
  | Open the first result                                         | 1, the owner's profile (the repository comes from the search result) |

- **Size:** release APK for arm64 20.5 MB; JS bundle (Hermes bytecode) 2.3 MB.
- **iOS:** not measured. The simulator runs the app on the Mac's CPU and GPU, so its numbers would describe the Mac, and Apple's tools for scroll hitches and launch phases only work on a device. Profiling a release build on a real iPhone (Instruments "App Launch" and "Animation Hitches") takes more time than this project had; it's entirely doable with the same method, and it's on the list of improvements.

**What keeps it fast**

- **Lists:** FlashList v2 recycles rows of a fixed shape (description clamped to two lines), with one press handler shared by every row ([`SearchResultsList`](src/screens/search/ui/SearchResultsList.tsx), [`RepoCard`](src/entities/repo/ui/RepoCard.tsx), [ADR-0009](docs/adr/0009-lists-and-images.md)).
- **Images:** avatars are requested at the size they're drawn, about 90% smaller than GitHub's default ([`avatarUrl.ts`](src/shared/api/github/avatarUrl.ts)).
- **Rendering:** the React Compiler memoises components automatically ([ADR-0014](docs/adr/0014-react-compiler.md)).
- **Startup:** Hermes bytecode; Details and Settings load on first use ([`RootNavigator`](src/app/navigation/RootNavigator.tsx)); R8 shrinks the Java code and resources.
- **Network:** typing is debounced (400 ms), results stay fresh for 5 minutes and owners for an hour, and Details opens from the search result without a request ([`useRepoSearch`](src/features/search-repos/queries/useRepoSearch.ts), [ADR-0007](docs/adr/0007-server-and-client-state.md), [ADR-0012](docs/adr/0012-rate-limits-no-auth.md)). The last session's results are kept on the device ([`persistence.ts`](src/app/query/persistence.ts)).

**Method and caveats**

- Release build (profileable, not debuggable) on an Android 16 emulator with 16 KB pages, 4 GB RAM and 60 Hz, rendering on the host GPU (Apple M4 Pro), animations on, against the live GitHub API. The script writes these conditions into every report.
- **An emulator, not a phone** (ADR-0017). Its frame times include about one refresh of waiting for the host GPU: that's the orange "swap buffers" part of the GPU bars, while the app's own work (the segments below it) is small. So the headline is the janky-frame share, not frame-time percentiles. GPU memory stays on the host and isn't in the memory numbers, so they aren't the app's total footprint on a phone.
- "First frame" is the launch screen; timing the first screen of content needs `reportFullyDrawn()`, which is in the backlog.
- The startup trace is one launch with tracing on, on the emulator in a window with Android Studio attached: 417 ms to the first frame there. Tracing slows every step, so the picture shows the order of the work (native libraries, the activity and React host, the launch-screen logo, OpenGL set up in parallel, then JavaScript), not its speed; the 97 ms comes from 10 untraced launches.
- Android's frame stats cover the UI and render threads, not JavaScript; the debug Perf Monitor and DevTools cover that side.
- **Why not Flipper:** it's deprecated and removed from React Native. React Native DevTools and Android's own tools replace it.

## Testing

Two layers: fast unit and integration tests on every push, and end-to-end flows on a real emulator ([ADR-0013](docs/adr/0013-testing-strategy.md)).

### Unit and integration (Jest)

**299 tests, 95% of statements and 86% of branches covered** (`yarn test --coverage`), run by `yarn validate` before every push and in CI. They use React Native Testing Library and MSW, so screens are tested the way a user sees them, against a fake GitHub API:

- **Every screen state**: loading, results, empty, error by kind, offline, rate-limited, and a saved copy standing in.
- **The API client**: rate limits (including GitHub's secondary limits), timeouts, cancellation, and validation of every response.
- **Search behaviour**: debounce, paging up to GitHub's 1,000-result cap, the cache, and a scripted session that counts GitHub requests exactly (the network table under Performance).
- **Offline and saved repos**: snapshots, their avatars, and data that no longer validates being dropped instead of crashing.
- **Accessibility floor**: every screen test checks that each control has a role and a label.

No test waits on a timer: gates and fake timers keep them deterministic (lint-enforced).

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

## What I'd improve with more time

Left out on purpose, each with the reason. Everything below was weighed in a backlog review at the end of Phase 5; the one item picked (keeping at most five searches in memory) is done.

**Testing and CI**

- **Deterministic end-to-end tests** against a mock-server build of the app. The live, rate-limited GitHub API makes today's flows occasionally flaky, which is why they run nightly and don't block merges.
- **iOS end-to-end tests in CI**, and an offline flow on iOS: macOS runners are slow, and iOS simulators have no airplane mode.
- **Render-performance tests (Reassure)** in CI, and a **coverage gate** on the critical modules: coverage is reported, not enforced.

**Performance**

- **Measurements on real phones**, Android and iPhone. Everything today comes from an emulator, and iOS isn't measured at all (see Performance).
- **Time to the first screen of content** (`reportFullyDrawn()`, which needs a small native module), and a breakdown of startup.
- **A smaller launch-screen logo**: it's decoded on the main thread before the first frame, about 40 ms in a traced launch.
- A FlatList-versus-FlashList comparison, as a table.

**Accessibility** (today: a role and a label on every control, checked by every screen's tests)

- **A full pass**: Dynamic Type up to 200%, a contrast audit of both themes, screen-reader announcements (result count, errors, save and unsave), reduced motion, and a check with the Accessibility Inspector that VoiceOver reaches every row's save button.

**Product**

- GitHub's own reason when a query is invalid, instead of a general hint.
- Search-term highlighting, a language filter, undo after removing a saved repo, and a search deep link.
- Reopening where you were after Android recreates the app (today it reopens on Search; nothing is lost).
- A launch screen that follows the in-app theme; it follows the system theme today.
- Predictive-back animations on Android 16: blocked upstream in React Native 0.87. Back itself works.

**Beyond this project**

- **Sign-in, or a small backend proxy** holding a token and a shared cache, to lift GitHub's rate limits: the production answer.
- **Crash reporting, production performance monitoring and privacy-first analytics**, already planned in [ADR-0018](docs/adr/0018-error-model.md).
- Localisation with an i18n library (the strings already live in one file), tablet layouts, a rendered README on Details, and over-the-air updates.

## Project conventions

- Agents (and humans) start at [AGENTS.md](AGENTS.md).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org), checked by commitlint; `yarn validate` runs before every push ([ADR-0024](docs/adr/0024-contribution-workflow.md)).

---

MIT licensed. Not affiliated with or endorsed by GitHub, Inc.
