# 0016. CI/CD and release: GitHub Actions, real keystore signing, provenance

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0012, ADR-0013, ADR-0015, ADR-0021, ADR-0022

## Context

The deliverables include an Android APK attached to a release, and the repository is public. On public repositories, standard GitHub-hosted runners (including macOS) are free with no minute limit. There is a concurrency limit: 20 jobs at once, 5 of them macOS. iOS _simulator_ builds need no code signing and no Apple Developer account.

A production-like release should be reproducible, signed with a stable key, and verifiable by the people who install it.

## Decision

**Workflows:**

| Job                                                                                                                     | Trigger                                                                                           | Runner        |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| JS: typecheck, lint, architecture and docs checks, knip, Jest + coverage summary                                        | every push to `main`                                                                              | ubuntu        |
| Android debug build                                                                                                     | every push to `main`                                                                              | ubuntu        |
| iOS simulator build (`xcodebuild -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO`)                                         | pushes to `main` that change `ios/**`, `package.json`, `yarn.lock` or `Gemfile*`; nightly; manual | macOS         |
| Android end-to-end (Maestro, `reactivecircus/android-emulator-runner`, hardware-accelerated emulator), **non-blocking** | nightly, manual                                                                                   | ubuntu        |
| Release                                                                                                                 | tag `v*`                                                                                          | ubuntu (APKs) |

Android end-to-end tests don't block merges, because they run against the live, rate-limited GitHub API and can be flaky. GitHub-hosted runners also share IP addresses, so the unauthenticated per-IP limits may already be partly used by other workflows. The improvements backlog holds: making them blocking (after a mock-server variant), iOS end-to-end tests in CI, and the iOS simulator `.app` on releases.

**Guardrails on every workflow:**

- Superseded runs are cancelled.
- A time limit on every job.
- Least-privilege permissions (read-only by default).
- Actions pinned to exact commits (SHA).
- Caches for Yarn, Gradle, Pods and Xcode build output.
- Artifacts kept for 7–14 days.

**Release signing (real keystore):**

- **The key:**
  - Generated once, locally, by the owner: PKCS12, RSA 4096, alias `reposcout`.
  - Backed up in a password manager. Losing it means installed apps can never be updated.
  - Never committed: `*.keystore` and `*.jks` are git-ignored, except the default `debug.keystore`.
- **The secrets:**
  - Stored in a GitHub **Environment `release`** (tag-only deployment, optional required reviewer): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
  - Only the tag-triggered release job can read them.
- **Gradle** `signingConfigs.release` reads `REPOSCOUT_UPLOAD_STORE_FILE`, `REPOSCOUT_UPLOAD_STORE_PASSWORD`, `REPOSCOUT_UPLOAD_KEY_ALIAS` and `REPOSCOUT_UPLOAD_KEY_PASSWORD` from environment variables (CI) or `~/.gradle/gradle.properties` (local). When they're missing (local reviewer builds), it **falls back to debug signing with a loud warning**.
- **Release job steps:**
  1. Decode the keystore into a temporary folder.
  2. `assembleRelease` with R8 and resource shrinking. `versionCode` comes from `github.run_number`; `versionName` comes from `package.json` (see Version below).
  3. Check the signature with `apksigner verify --print-certs`, and 16 KB page alignment with `zipalign -c -P 16 -v 4` (ADR-0023).
  4. Write a `sha256sum` checksum file.
  5. Record **build provenance** with `actions/attest-build-provenance`, which anyone can check with `gh attestation verify`.
  6. Create a GitHub Release with **two APKs**: a universal one (all 4 CPU types, always works) and an **arm64-v8a** one (much smaller, fits virtually every modern phone). Both are checked, checksummed and attested; the README lists their sizes. The Play Store would use an AAB instead. Also attach the checksum file and short hand-written release notes. GitHub's generated notes are built from merged pull requests, which this project doesn't use (ADR-0024).
  7. Delete the keystore (runs even if a step failed).
- The README publishes the signing certificate's SHA-256 fingerprint and how to verify the APK.
- **Dry run first:** a prerelease tag (`v1.0.0-rc.1`) exercises the whole pipeline before `v1.0.0`. Installing `v1.0.0` over the rc build also proves both are signed with the same key, so updates install.
- **End-to-end builds:** the non-blocking end-to-end job builds a release variant without secrets, so it uses the debug-signing fallback. That still catches R8 stripping bugs, which only appear in release builds.
- Optional: also build an AAB, to show the app is ready for Play Store upload. With Play App Signing, our key would become the _upload_ key.

**Version: `package.json` is the single source of truth.**

- Android: `app/build.gradle` reads `versionName` from `package.json` at build time. `versionCode` comes from `REPOSCOUT_VERSION_CODE` (the CI run number), defaulting to 1 locally.
- iOS: `MARKETING_VERSION` is written by `scripts/sync-version.mts`, which `yarn release:prepare <x.y.z>` runs together with the `package.json` bump. The build number is the CI run number.
- JS: the same script writes `src/shared/config/version.generated.ts` for the About screen. That way the app doesn't bundle all of `package.json`.
- Checks:
  - `yarn check:version` (part of `yarn validate`) fails if `package.json`, the iOS project and the generated version file disagree.
  - The release workflow fails unless the tag equals `v` + the `package.json` version.
- Alternative rejected: deriving the version from the git tag alone. JS can't read the tag without a native module or build-time injection, and local builds would have no version.

**Dependencies:** updated manually and deliberately. Automated dependency updates (Dependabot or Renovate, grouped, with security alerts) are in the improvements backlog. React Native itself is upgraded only through the Upgrade Helper (ADR-0002).

## Alternatives considered

- **EAS Build.** Requires Expo (ADR-0002).
- **Bitrise / Codemagic.** Capable, but a separate service when GitHub Actions is free and next to the code.
- **fastlane.** Useful once we ship to stores. Too much for building an APK.
- **Debug-signed release APK.** Simpler, but not production-like: signatures change between builds, so updates won't install over each other.
- **Everything manual-only.** Needed only for private repos to save minutes. The repo is public.

## Consequences

Positive:

- Every change is checked on both platforms.
- Releases are reproducible, signed, checksummed and verifiable.
- Signing secrets are handled to production standard.

Negative / accepted costs:

- iOS jobs are slow (roughly 15–25 minutes), which is why they run only when native-relevant files change, plus nightly.
- Keystore custody is a real responsibility (documented).

## Enforcement

- CI runs on every push to `main`; a red run is fixed before anything else (ADR-0024).
- Workflows are reviewed like code. `check-docs.ts` validates the README's links to releases.

## References

- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations
- https://developer.android.com/tools/apksigner
