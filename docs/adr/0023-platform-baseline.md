# 0023. Platform baseline: form factor, branding, accessibility floor, Android and iOS production readiness

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0002, ADR-0006, ADR-0010, ADR-0016

## Context

"Production-ready" on mobile means more than working screens. Stores and platforms impose requirements:

- Android 15+ enforces edge-to-edge for apps targeting SDK 35+.
- Google Play requires 16 KB memory page support for apps targeting Android 15+.
- Apple requires a privacy manifest for "required-reason" APIs.
- Android 16 ignores orientation locks on large screens (smallest width ≥ 600dp) for apps targeting SDK 36+. The temporary opt-out stops working at SDK 37 (checked 2026-09-26).
- GitHub's brand rules forbid modifying the GitHub logos, using any GitHub logo as a project's icon or logo, or implying GitHub endorses the project. The Octocat design is registered copyright (checked 2026-09-26).

Users also expect accessibility support. None of this is in the brief. Given the time budget, the project owner scoped accessibility down to a minimal floor and deferred the full pass.

## Decision

**Accessibility: minimal floor now, full pass deferred.**

- **In scope:** every pressable (including icon-only buttons) has `accessibilityRole` and a label. It costs almost nothing, and our tests find elements by role and label, so they enforce it.
- **Deferred to the improvements backlog:**
  - announcing each list row as one element ("facebook/react-native, 120 thousand stars, …")
  - checking Dynamic Type / font scaling up to 200%
  - a contrast audit (at least 4.5:1)
  - `announceForAccessibility` for result counts, errors and saving
  - respecting reduced motion
  - a 44-pt touch-target audit and a per-screen checklist

  The README lists this under "What I'd improve".

**Android:**

- Edge-to-edge with safe-area insets.
- Predictive back gesture: opted in if React Native 0.87 and react-native-screens support it cleanly (checked in Phase 4). Otherwise it's left off and noted in the backlog.
- **16 KB page size compatibility** verified on the release APK (`zipalign -c -P 16 -v 4`, and checking native libraries, especially MMKV/Nitro).
- `allowBackup` stays on, so saved repos survive a device migration (documented).
- Cleartext traffic is disabled in release.
- Release builds use R8 with resource shrinking; keep rules are added only when a library needs them.
- Debug builds use the `applicationIdSuffix ".debug"` and the name "RepoScout Dev", so they install next to the release APK.

**iOS:**

- `PrivacyInfo.xcprivacy` covers required-reason APIs (for example UserDefaults and file timestamps). Every native library's manifest is checked.
- The launch screen comes from bootsplash.
- Dark appearance is supported. Dynamic Type verification is part of the deferred accessibility pass.

**Form factor: phones, portrait-only.**

- iOS: `TARGETED_DEVICE_FAMILY = 1` (iPhone only; on iPad it runs in iPhone compatibility mode) and portrait-only in `Info.plist`.
- Android: `screenOrientation="portrait"`. On large screens Android 16+ ignores it, so **layouts stay flexible**: no fixed widths, and nothing may break in landscape on a tablet (checked on a tablet emulator in Phase 4). We don't use the temporary opt-out, because it disappears at SDK 37.
- Tablet-optimised layouts are in the improvements backlog.

**Branding: an original emblem, no GitHub marks.**

- The RepoScout emblem: a scout's campaign hat resting on a magnifying glass whose lens shows a git-branch glyph, inside a round forest-green badge. It was chosen over two character mascots (an owl and a fox) because it stays legible down to 24 px. Nothing resembles the Octocat or GitHub's logo.
- The source SVG is `assets/brand/reposcout-emblem.svg`. `yarn brand:generate` (`scripts/generate-brand-assets.mts`, using sharp) produces:
  - Android adaptive icons plus a monochrome layer for Android 13+ themed icons
  - the iOS 1024 px icon
  - the bootsplash logo
- The GitHub name is used only descriptively ("explore GitHub repositories"). The `mark-github` Octicon is used only to mean "open on GitHub".
- The README and About screen say: "Not affiliated with or endorsed by GitHub, Inc."

**Both:**

- App icon (the emblem, above) and display name "RepoScout".
- Version numbers come from `package.json` (ADR-0016).
- No developer menus or debug tooling in release builds.

## Alternatives considered

- **Handling this "later".** These are cheap now and expensive to retrofit. Store rejections block releases.
- **A modified GitHub logo or Octocat as the logo or mascot.** Explicitly forbidden by GitHub's brand rules, and a legal risk in a public repository.
- **Android's temporary orientation opt-out** (`PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`). It disappears at SDK 37, so relying on it only postpones the work.
- **A full accessibility pass now.** Valuable, but it doesn't fit the time budget. Deferred with a concrete list so it can be picked up (improvements backlog).
- **Full WCAG audit tooling.** Out of scope.

## Consequences

Positive:

- Release builds behave correctly on current OS versions and pass store requirements.
- Controls are labelled for screen readers. Full accessibility is a known, documented gap.

Negative / accepted costs:

- A few native configuration changes.
- Accessibility beyond the floor is a documented gap until the deferred pass is done.

## Enforcement

- React Native Testing Library tests query by role and label, so missing labels fail tests.
- The `rn-review` skill checks the accessibility floor (unlabelled pressables) and the platform items.
- The 16 KB check is a step in the release workflow.

## References

- https://developer.android.com/develop/ui/views/layout/edge-to-edge
- https://developer.android.com/guide/practices/page-sizes
- https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- https://reactnative.dev/docs/accessibility
