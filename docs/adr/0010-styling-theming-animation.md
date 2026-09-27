# 0010. Styling, theming and animation: StyleSheet + ThemeContext + `makeStyles`, core Animated

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0005 (file convention), ADR-0019, ADR-0023

## Context

The app needs light and dark themes (following the system, with a manual override), a consistent design system and a small animation: the skeleton pulse. Theme switches are rare user actions. Every extra native or styling library adds build complexity and runtime cost.

## Decision

**Tokens** (`shared/theme/tokens.ts`):

- Semantic colours: `bg`, `surface`, `textPrimary`, `textMuted`, `accent`, `border`, `danger`, …
- A 4-point spacing scale, radii, and a typography scale.
- Light and dark theme objects built from them. A formal contrast audit is deferred (ADR-0023).

**Provider:**

- The theme preference (`system | light | dark`) lives in a Zustand store in `shared/theme`, persisted with MMKV (ADR-0011). Settings → Appearance changes it through the `switch-theme` feature's segmented control.
- `ThemeProvider` resolves the preference plus `useColorScheme()` into a `Theme` and puts it in context. The context value is memoised.
- It also passes an explicit preference to `Appearance.setColorScheme()` (`auto` for `system`), so native UI follows the in-app choice too: alerts, the keyboard, the share sheet. Found on device: without it, a confirmation dialog in dark mode rendered light.

**`makeStyles((theme) => StyleSheet.create({...}))`:**

- Returns a `useStyles()` hook that caches styles per theme object, so styles are created once per theme, not on every render.
- Typed like React Native 0.87's own `StyleSheet.create`, `<S>(styles: S & NamedStyles)`. The intersection keeps literal values such as `'row'` from widening to `string`. RN 0.87's strict API no longer exports `StyleSheet.NamedStyles`, so we define the equivalent from `ViewStyle | TextStyle | ImageStyle`.
- Styles that don't depend on the theme use a module-level `StyleSheet.create`.

**File convention:**

- Every component has a sibling `X.styles.ts` (ADR-0005). No inline style objects.
- Dynamic values computed from props are the only exception (`[styles.bar, { width }]`).

**Platform chrome:**

- The navigation theme, status bar style and Android navigation bar colour come from the same tokens, so nothing flashes on toggle.

**Language colours:**

- A small static map for the top ~30 languages, with a hash-based fallback colour. It lives in `entities/repo/lib/languageColors.ts`: it's domain knowledge about repos, not a theme token (ADR-0005).

**Animation: core `Animated` with `useNativeDriver: true`.**

- The skeleton pulse is an opacity loop.
- Deferred to the improvements backlog: a header fade on scroll (`Animated.event`) and respecting reduced motion (`AccessibilityInfo.isReduceMotionEnabled`).

**Icons: Octicons** (`@react-native-vector-icons/octicons`).

- GitHub's own icon set, MIT-licensed. It matches what the app is about: star, repo-forked, eye, issue-opened, bookmark, search, gear.
- Font-based: an icon is a text glyph, which is cheap to render in list rows.
- Used only through `shared/ui/Icon`, which fixes size and colour to theme tokens and requires a label for icon-only buttons.
- The `mark-github` glyph is used only to mean "open on GitHub", never as our own branding (ADR-0023).
- Setup, verified in Phase 1 on both platforms: v21 ships only the font, packaged natively (an Android asset and an iOS podspec) with no native module code. iOS registers `Octicons.ttf` under `UIAppFonts` in `Info.plist` (via the package's `rnvi-update-plist` tool); Android needs nothing.

**Haptics** (`react-native-haptic-feedback` 3.0, used only through `haptics` in `shared/lib`; lint rejects the import elsewhere):

- A light impact when an action takes effect (save or unsave, share, pull-to-refresh) and a selection tick when the theme changes. Nothing else, so the feedback stays meaningful.
- The library honours the system setting: with haptics off, nothing plays. No vibration fallback on old iPhones without a Taptic Engine.
- Admission (ADR-0002), checked 2026-09-27: a New Architecture TurboModule (codegen spec); 3.0.0 released 2026-03-29 with commits into mid-2026; React Native has no haptics API (`Vibration` drives the raw vibrator, not UI haptics). Android gets the normal `VIBRATE` permission, granted at install without a prompt.

**UI catalog (development only):** `screens/ui-catalog` shows every token and shared component in the current theme, with a theme switch. It's used for design review, and becomes reachable only in development builds once navigation exists.

**Splash screen** (react-native-bootsplash):

- The logo is the RepoScout emblem, a round badge (ADR-0023), so it works on light and dark backgrounds and fits Android 12+'s circular splash mask.
- The background follows the system appearance: Android `values-night`, and an iOS named colour with a dark variant. We set these up ourselves because bootsplash's dark-mode generation needs a paid licence.
- Accepted trade-off: the splash follows the _system_ theme. If the user's in-app override differs, colours switch once the app renders. Reading the stored preference natively is in the improvements backlog.

## Alternatives considered

- **react-native-unistyles v3.** It switches themes without React re-renders and supports variants and breakpoints. But it's an extra Nitro native dependency for a benefit (cheap theme toggles) we rarely use. Noted as the upgrade path if theming grows.
- **NativeWind (Tailwind).** Familiar from the web, but an extra build step. Class strings are harder to type-check against our tokens.
- **Tamagui / Restyle.** Full design-system frameworks; too heavy for this scope.
- **Styles inline in the component file.** Rejected by project convention (ADR-0005): harder to review, and it can't be lint-enforced consistently.
- **Reanimated 4 (+ worklets).** Needed for gesture-driven or layout animations, which we don't have. It adds a native dependency and build time. We'll add it when a feature needs it.
- **Icons: `react-native-svg` + Lucide.** A bigger, modern set, but each icon is an SVG component (heavier in list rows) and `react-native-svg` is another native dependency.
- **Haptics: `expo-haptics`.** Needs the Expo modules layer (ADR-0002). **Core `Vibration`:** a raw buzz, not the system's UI haptics.
- **Icons: a hand-made minimal set.** Fewest dependencies, but more manual work and less consistency.
- **Buying the bootsplash licence for dark splash generation.** Works, but setting two native colour resources by hand is trivial.

## Consequences

Positive:

- No styling dependencies; plain React Native styles are the fastest path.
- The tokens make visual consistency the default.
- Animations run on the native thread.

Negative / accepted costs:

- **Toggling the theme re-renders everything that reads the theme.** It's rare, measured once, and noted in the README.
- Two files per component.

## Enforcement

- Lint:
  - `StyleSheet.create` / `makeStyles` only in `*.styles.ts`
  - `react-native/no-inline-styles`
  - `react-native/no-color-literals` (colours come from tokens)
  - (`react-native/no-unused-styles` stays off: styles live in a sibling file, so the rule would report every style as unused.)
- The `rn-review` skill flags hard-coded spacing, sizes or colours in `*.styles.ts`.

## References

- https://reactnative.dev/docs/stylesheet
- https://reactnative.dev/docs/animations#using-the-native-driver
