# 0021. Local end-to-end isolation with dedicated headless devices (Docker rejected)

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0013, ADR-0016, ADR-0017

## Context

We want to run Maestro end-to-end tests and record demo videos locally, in a repeatable, isolated way, ideally in the background without taking over the developer's screen or everyday emulator. Docker was considered, since it's the usual answer for isolation.

- **iOS can't run in containers.** There are no macOS containers, and Apple's licence doesn't allow them.
- **The Android emulator in Docker on macOS has no hardware acceleration.** Docker Desktop runs a Linux VM without KVM or nested virtualisation, so the emulator is unusably slow.
- JS checks are already reproducible with a pinned Node (`.nvmrc`) and corepack Yarn. CI already builds the APK reproducibly (ADR-0016).

As of 2026-09-26, `sdkmanager` is deprecated in cmdline-tools 23 in favour of the new **Android CLI** (`android sdk …`). `avdmanager` still ships.

## Decision

**No Docker for the mobile runtime.** Use **dedicated, headless, natively accelerated devices** managed by scripts.

**`scripts/e2e/setup-devices.sh`** (safe to run repeatedly):

- Creates the `RepoScout-E2E` Android emulator from a pinned system image, with a mid-range profile (about 4 GB RAM, 60 Hz). It uses `android sdk` with a `sdkmanager` fallback, then `avdmanager`.
- Creates a dedicated iOS simulator (pinned device type and runtime).
- Both are separate from the developer's everyday devices.

**`yarn e2e:android` / `yarn e2e:ios`:**

1. Start the device headless: `emulator -avd RepoScout-E2E -no-window -no-audio -no-boot-anim -no-snapshot-save`, or `xcrun simctl boot` without opening Simulator.app.
2. Wait for boot, then install the **release** build.
3. Run Maestro with JUnit output and screen recording.
4. Collect artifacts in `e2e/artifacts/` (git-ignored), then shut the device down.
5. Flags: `--keep-alive` (don't shut down), `--headed` (show the window for debugging).

**`yarn e2e:record`:** the same flows, used to produce the README demo videos repeatably.

## Alternatives considered

- **Docker (e.g. `budtmo/docker-android`).** No hardware acceleration on macOS hosts, and impossible for iOS.
- **The developer's normal emulator and simulator.** No isolation: test data and state leak both ways.
- **Cloud device farms** (Maestro Cloud, BrowserStack). Paid, and not needed at this scale.

## Consequences

Positive:

- Fast, accelerated, repeatable test runs in the background.
- Same flows locally and in CI.
- Demo videos are reproducible.

Negative / accepted costs:

- Needs the Android SDK and Xcode installed locally (documented prerequisites).
- Scripts must track SDK tooling changes (the Android CLI migration).

## Enforcement

- The scripts are the only documented way to run end-to-end tests locally. CI uses the same Maestro flows (ADR-0016).

## References

- https://maestro.mobile.dev
- https://developer.android.com/studio/run/emulator-commandline
- Android CLI: https://d.android.com/tools/agents/android-cli
