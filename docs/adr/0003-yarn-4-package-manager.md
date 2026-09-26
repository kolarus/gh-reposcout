# 0003. Yarn 4 via corepack, node-modules linker

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0002

## Context

The brief's setup instructions are `yarn install && yarn android/ios`. Yarn 1 (classic) has been in maintenance mode for years.

React Native tooling (Metro, CocoaPods autolinking, Gradle autolinking, codegen) expects a real `node_modules` folder. Yarn's Plug'n'Play mode isn't supported.

Corepack, which pins the package manager version per project, ships with Node 24. It is no longer bundled from Node 25 onwards, where it's a separate `npm i -g corepack`.

## Decision

- Use **Yarn 4** (4.18.1), pinned through the `packageManager` field in `package.json` and activated with `corepack enable`.
- **Exact versions:** `.yarnrc.yml` sets `defaultSemverRangePrefix: ""`, so `package.json` lists exact versions, and `yarn.lock` pins the rest.
- `.yarnrc.yml` sets `nodeLinker: node-modules`.
- Commit `yarn.lock`. CI runs `yarn install --immutable`.
- Scripts are the public interface: `yarn android`, `yarn ios`, `yarn test`, `yarn lint`, `yarn typecheck`, `yarn validate`, `yarn e2e:*`.
- iOS pods: the React Native CLI installs them automatically when running `yarn ios` (`automaticPodsInstallation: true` in `react-native.config.js`). Checked in the CLI source: it prefers `bundle exec pod` and runs `bundle install` first, so the pinned CocoaPods from the `Gemfile` is used. `yarn pods` (`bundle exec pod install`) is the manual fallback. Together, `yarn install && yarn ios` works as the brief asks, without a slow `postinstall` on every install.

- **Dependency install scripts:** Yarn 4 doesn't run dependencies' install scripts by default, which is a good supply-chain default. The git hooks are therefore installed by our own root `postinstall` script (`lefthook install`) rather than by lefthook's package script.

## Alternatives considered

- **Yarn 1 classic.** Unmaintained, weaker lockfile guarantees.
- **npm.** Works, but the brief explicitly uses yarn.
- **pnpm.** Fast and strict, but its symlinked layout has historically needed Metro and autolinking workarounds in React Native.
- **Bun.** Promising, but less proven with React Native native tooling.
- **Yarn PnP.** Unsupported by React Native tooling.

## Consequences

Positive:

- Reproducible installs with a pinned package manager version, matching the brief's commands.

Negative / accepted costs:

- Contributors need `corepack enable` once (documented in the README).
- Node 25 and later need corepack installed separately (documented).

## Enforcement

- The `packageManager` field (corepack refuses a mismatched Yarn).
- `--immutable` installs in CI.
- `engines` in `package.json`.

## References

- https://yarnpkg.com/corepack
