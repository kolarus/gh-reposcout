# 0017. Performance measurement methodology

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0009, ADR-0014, ADR-0021

## Context

The brief evaluates "60 FPS scrolling, fast startup, low memory" and asks for "performance screenshots/metrics (Flipper/DevTools)".

- **Flipper is deprecated** and has been removed from React Native templates since 0.74. React Native 0.87 also removed the standalone react-devtools connection in favour of **React Native DevTools**.
- The project owner chose to measure on the **emulator and simulator only**. Absolute numbers from emulators don't represent real devices, because they depend on the host machine's CPU and GPU.
- **Debug-only tools.** React Native DevTools and the Perf Monitor overlay only connect to debug builds, where JavaScript runs unoptimised (development checks, no minification). Their numbers understate the app. Android's system tools (`gfxinfo`, the GPU rendering bars, `meminfo`, `am start`) and Android Studio's profilers work on release builds, the last only if the build is marked `profileable`.

## Decision

- **Every number comes from a release build.** Record the conditions: emulator or simulator image, host machine, OS version, build variant, network.
- **Report relative evidence, not absolute claims:** dropped-frame percentage, render counts, memory growth after scrolling, request counts.
- **Emulator setup:** an Android emulator profile resembling a mid-range phone (about 4 GB RAM, arm64, 60 Hz), created by the device script (ADR-0021). It must render on the **host GPU** (`-gpu host`): headless, the emulator otherwise picks software rendering (lavapipe / SwiftShader), and frame times would measure the host CPU drawing pixels, not the app. `yarn perf:android` refuses to run without it.
- **The release build is `profileable`** (`<profileable android:shell="true" />` in the release manifest), so Android Studio's profilers can attach. Unlike `debuggable`, it adds no debugging features and doesn't change how the app runs.

**Evidence matrix.** Each thing the brief evaluates gets one headline number and one screenshot from a tool. Files live in `docs/media/perf/`, and every caption states the build type, device and date.

| The brief asks for | Headline number (release build)                                                                                                         | Screenshot                                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 60 FPS scrolling   | Janky-frame % and 90th / 99th percentile frame times from `adb shell dumpsys gfxinfo <pkg>` after a scripted fling through 300+ results | `scroll-gpu-bars.png`: Android's "Profile HWUI rendering" bars mid-fling (release). `scroll-perf-monitor.png`: the Perf Monitor overlay mid-fling (debug, captioned as such; under the New Architecture it shows UI FPS and dropped frames, no JS FPS) |
| Fast startup       | Cold-start time to first frame: `adb shell am start -W` `TotalTime` after `am force-stop`, median of 10                                 | `startup-trace.png`: Android Studio Profiler (or Perfetto) system trace of a cold start, first frame marked (release, profileable)                                                                                                                     |
| Low memory         | PSS and Java / native heap from `adb shell dumpsys meminfo`, before and after scrolling 1,000 results                                   | `memory-timeline.png`: Android Studio Profiler memory timeline across that scroll (release, profileable)                                                                                                                                               |

Supporting evidence, after the three rows:

| Evidence    | Source                                                                                                                                                                                                                                                                                                                      | Form                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Render cost | React Native DevTools, a results change: its Performance panel's Components ⚛ track (the React Profiler panel recorded nothing on RN 0.87); compiler badges (ADR-0014)                                                                                                                                                      | `devtools-profiler.png`, `compiler-badges.png` (debug: the shape of the work, not speed) |
| iOS         | Not measured. The simulator runs the app on the Mac's CPU and GPU, so its timings would describe the Mac, and Instruments' iOS tools need a device ("Animation Hitches" refuses the simulator; "App Launch" records no phases there). Real-device profiling is doable with the same method but didn't fit the time: backlog | none                                                                                     |
| Size        | Release APK size; JS bundle size (`react-native bundle`, source-map-explorer)                                                                                                                                                                                                                                               | table                                                                                    |
| Network     | Requests per scripted session (shows the debounce and cache at work): a Jest session against MSW, which counts every request exactly and runs in CI. GitHub's `rate_limit` endpoint can't count them on the device: it doesn't report unauthenticated search use                                                            | table                                                                                    |

**README Performance section**, in this order:

1. The evidence matrix as a short table: what the brief asks for → result → screenshot link.
2. The optimisations, each linked to its code.
3. Method and the emulator caveat, clearly visible.
4. Why not Flipper: deprecated and removed from React Native; React Native DevTools and the platform profilers replace it.

**In the improvements backlog:** a FlatList-versus-FlashList before/after comparison, TTFD via `reportFullyDrawn()` (needs a small native module), a `react-native-performance` startup breakdown, Reassure in CI, and real-device measurements (Android, and iOS with Instruments "App Launch" and "Animation Hitches" on an iPhone).

## Alternatives considered

- **Flipper.** Deprecated and unsupported on current React Native.
- **Real devices.** More credible, but not available for this project (owner decision). Listed under "with more time".
- **Flashlight (Android performance scoring).** Usable if maintained at measurement time. An optional extra, not the basis.

## Consequences

Positive:

- Honest, reproducible numbers that show which optimisations work.

Negative / accepted costs:

- No absolute "60 FPS on a device X" claim. We state that explicitly.

## Enforcement

- Measurements are scripted where possible (`yarn perf:android`, `scripts/perf/android.sh`), so they can be re-run after changes.
- The Phase 5 exit check: every row of the evidence matrix has its number and its screenshot, and every caption names the build type.
- Reassure in CI is in the improvements backlog.

## References

- https://reactnative.dev/docs/react-native-devtools
- https://developer.android.com/topic/performance/rendering/inspect-gpu-rendering
- https://developer.android.com/guide/topics/manifest/profileable-element
