# 0002. Bare React Native CLI with the official TypeScript template

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0003 (package manager), ADR-0004 (TypeScript), ADR-0016 (CI/release)

## Context

The brief allows any stack. Its example command is `npx react-native init GitHubExplorer --template react-native-template-typescript`, and it asks that `yarn install && yarn android/ios` work.

Facts as of 2026-09-26:

- React Native **0.87.1** is the latest stable release. 0.88 is scheduled for about 2026-10-12.
- 0.87 requires **Node ≥ 22.13**, **JDK 17**, **Xcode ≥ 26** and **AGP 9**, with compileSdk 37.
- The New Architecture is always on; TurboModules can no longer be turned off. Hermes is the default engine.
- `react-native init` is deprecated and has been removed in favour of `@react-native-community/cli init`.
- The default template has been **TypeScript since React Native 0.71**. The separate `react-native-template-typescript` is archived.
- 0.87 makes the **strict TypeScript API** the default, so deep imports (`react-native/Libraries/*`) are type errors.
- SwiftPM support is experimental and opt-in. CocoaPods remains the default.

## Decision

- **Use bare React Native**, scaffolded from the official community CLI template, which is TypeScript. The command used (in a scratch folder, because `init` creates a new directory, then moved into the repository):
  `npx @react-native-community/cli@20.2.0 init RepoScout --version 0.87.1 --package-name com.bohdanmorozov.reposcout --title RepoScout --pm yarn --skip-install --install-pods false --skip-git-init`
  - The template brought React 19.2.3, TypeScript 6.0.3 and CLI 20.2.0.
  - It was run untouched on an Android emulator and an iOS simulator before any change, so later problems can't be blamed on the template.
- **Pin React Native 0.87.x.** Don't move to 0.88 during this project.
- Keep the defaults: **New Architecture and Hermes**. Use **CocoaPods** on iOS (through Bundler). Apply the AGP 9 opt-outs recommended in the 0.87 release notes (`android.builtInKotlin=false`, `android.newDsl=false`).
- **Toolchain:** Node 24 LTS (`.nvmrc`), JDK 17, Xcode 26, Ruby 3.x with Bundler.
- **Native projects** (`android/`, `ios/`) are committed and owned by us.
- **Admission rule for native dependencies.** A new native library must:
  1. support the New Architecture
  2. be actively maintained (a release within about 6 months)
  3. justify itself against a core API or a few lines of our own code
  4. be recorded in the relevant ADR or README section
- **Upgrade policy.**
  - Use the React Native Upgrade Helper diff, one minor version at a time, on a dedicated branch, never in the middle of a feature.
  - Dependencies are updated deliberately, by hand. Automated dependency updates (Dependabot or Renovate) are in the improvements backlog.

## Alternatives considered

- **Expo with generated native projects (CNG) and dev builds.** This is what the React Native docs now recommend for new apps. It means less native boilerplate, easy upgrades, and libraries like `expo-image`. It was rejected by the project owner: we want full ownership of the native projects, to match the brief's CLI example, and no Expo modules layer. Cost accepted: we hand-configure the splash screen, icons, signing and deep links.
- **Bare CLI plus `install-expo-modules`** (to use individual Expo libraries). It mixes two ecosystems, and no library we need requires it.
- **The brief's exact command.** Deprecated tooling and an archived template. Using it would signal outdated practice. The README explains the deviation.
- **Tracking the newest release (0.88).** Not released yet. Chasing it mid-project adds risk for no gain.

## Consequences

Positive:

- Full control and visibility of Android and iOS build configuration (signing, R8, edge-to-edge, privacy manifest).
- Matches the brief's intent and commands (`yarn android` / `yarn ios`).
- Strict TypeScript API from React Native itself.

Negative / accepted costs:

- More native configuration to maintain; upgrades touch native files.
- No over-the-air updates or Expo libraries out of the box. The alternatives are recorded per need (ADR-0009, ADR-0010).
- iOS needs Ruby, Bundler and CocoaPods.

## Enforcement

- `.nvmrc` plus `engines` in `package.json`.
- CI uses pinned Node and JDK versions.
- The `rn-review` skill checks new native dependencies against the admission rule.

## References

- React Native 0.87 release notes: https://reactnative.dev/blog/2026/08/11/react-native-0.87
- React Native releases: https://reactnative.dev/docs/releases
- Upgrade Helper: https://react-native-community.github.io/upgrade-helper/
