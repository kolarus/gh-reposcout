# 0017. Performance measurement methodology

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0009, ADR-0014, ADR-0021

## Context

The brief evaluates "60 FPS scrolling, fast startup, low memory" and asks for "performance screenshots/metrics (Flipper/DevTools)".

- **Flipper is deprecated** and has been removed from React Native templates since 0.74. React Native 0.87 also removed the standalone react-devtools connection in favour of **React Native DevTools**.
- The project owner chose to measure on the **emulator and simulator only**. Absolute numbers from emulators don't represent real devices, because they depend on the host machine's CPU and GPU.

## Decision

- **Always measure release builds**, and record the conditions: emulator or simulator image, host machine, OS version, build variant, network.
- **Report relative evidence, not absolute claims:**
  - dropped-frame percentage
  - render counts
  - memory growth after scrolling
  - request counts
- **Emulator setup:** an Android emulator profile resembling a mid-range phone (about 4 GB RAM, arm64, 60 Hz), created by the device script (ADR-0021).

| Metric                                              | Tool                                                                                                                                                                                      | Reported as               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Scroll smoothness while flinging through 300+ items | Android: `adb shell dumpsys gfxinfo <pkg> framestats`, Perf Monitor overlay; iOS: Instruments "Animation Hitches" (indicative)                                                            | janky-frame %, screenshot |
| JS and UI thread FPS                                | Perf Monitor overlay                                                                                                                                                                      | screenshot during a fling |
| Render cost                                         | React Native DevTools Profiler (search → results), compiler badges (ADR-0014)                                                                                                             | flame graph screenshot    |
| Cold start                                          | TTID (first frame): `adb shell am start -W` `TotalTime` after `am force-stop`, median of 10; plus one JS timing mark at the first Search render. iOS: Instruments App Launch (indicative) | table                     |
| Memory                                              | `adb shell dumpsys meminfo` before and after scrolling 1,000 items                                                                                                                        | table                     |
| Size                                                | release APK size; JS bundle size (`react-native bundle`, source-map-explorer)                                                                                                             | table                     |
| Network                                             | requests per scripted session (shows debounce and cache effect)                                                                                                                           | table                     |

- **In the improvements backlog:** a FlatList-versus-FlashList before/after comparison, TTFD via `reportFullyDrawn()` (needs a small native module), a `react-native-performance` startup breakdown, Reassure in CI, and real-device measurements.
- Results go in the README's Performance section with a clearly visible **emulator caveat**. Raw captures live in `docs/media/perf/`.

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

- Measurements are scripted where possible (`scripts/perf/*`), so they can be re-run after changes.
- Reassure in CI is in the improvements backlog.

## References

- https://reactnative.dev/docs/react-native-devtools
- https://developer.android.com/topic/performance/rendering/inspect-gpu-rendering
