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

**`scripts/e2e/setup-devices.sh`** (`yarn e2e:setup`, safe to run repeatedly):

- Creates the `RepoScout-E2E` Android emulator from a pinned system image: **Android 16 (API 36) with 16 KB memory pages** (`google_apis_ps16k`, arm64 or x86_64 to match the host), so every run also proves the app works on a 16 KB device (ADR-0023). Google APIs without the Play Store: no account prompts. A mid-range profile (Pixel 7 screen, 4 GB RAM) and a cold boot every time. It uses `android sdk` with a `sdkmanager` fallback, then `avdmanager`.
- Creates the `RepoScout-E2E` iOS simulator: an iPhone 17 on the newest installed iOS 26 runtime (the family is pinned; patch runtimes come with Xcode).
- Both are separate from the developer's everyday devices; the emulator uses its own port (5580).
- **Maestro** is pinned (2.10.0, `~/.maestro`; `MAESTRO` overrides the path). Installing it by hand from the release zip, with its published SHA-256 checked, avoids the installer's edits to shell profiles; CI installs it the same way.
- The scripts are plain Bash, compatible with macOS's Bash 3.2.

**`yarn e2e:android` / `yarn e2e:ios`:**

1. Start the device headless: `emulator -avd RepoScout-E2E -no-window -no-audio -no-boot-anim -no-snapshot-save`, or `xcrun simctl boot` without opening Simulator.app.
2. Wait for boot, then install the **release** build.
3. Run Maestro with JUnit output. Android animations are switched off on the dedicated emulator for steadier runs.
4. Collect artifacts in `e2e/artifacts/<platform>/` (git-ignored): the JUnit report, and for a failing flow its screenshot and view hierarchy. Then shut the device down.
5. Flags: `--keep-alive` (don't shut down), `--headed` (show the window for debugging).

**`yarn e2e:record <platform>`:** the same run with `RECORD=true` and Android animations on, used to produce the README demo videos repeatably. Each flow records itself (Maestro's `startRecording` / `stopRecording`, in shared subflows that do nothing unless `RECORD` is set), so a video spans exactly its flow; the script copies them to `e2e/artifacts/<platform>/<flow>.mp4`, a retake's video replacing the failed take's. Recording from outside the flow was tried and dropped: stopping the adb client doesn't stop the device's `screenrecord`, so every video ran to its 3-minute cap.

**`yarn media:android`:** the README's demo GIF and screenshots, from a scripted tour of the release build (`e2e/media/tour.yaml`, outside the E2E suite) on the same emulator, with Android's demo mode for a clean status bar. The tour records itself; the frames are extracted with AVFoundation (`scripts/media/frames.swift`, part of macOS, so no ffmpeg) and joined into a looping GIF with `sharp`, already a dev dependency. Output goes to `docs/media/`, so it's regenerated after a UI change rather than captured by hand.

**Retry:** every run (recording or not) runs all the flows, then the failed ones once more; the retry decides the result.

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
