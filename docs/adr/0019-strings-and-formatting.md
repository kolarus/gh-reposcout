# 0019. Centralised strings and our own formatters (no i18n library yet)

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0008, ADR-0010

## Context

The app ships in English only, but should be ready for localisation without a rewrite. Rows show compact star counts (`12.3k`) and relative dates (`3d ago`), and the header shows the grouped result count (`12,345 repositories`).

Facts as of 2026-09-26:

- **Hermes has no `Intl.RelativeTimeFormat`.**
- `Intl.NumberFormat` with `notation: 'compact'` isn't reliable across Hermes on Android and iOS.
- The FormatJS polyfills would add significant bundle weight for two functions.
- _Creating_ an `Intl` formatter is expensive (locale resolution), while calling `.format()` is cheap.

## Decision

**Strings:** all user-facing copy lives in `shared/i18n/strings.ts` as a typed object; components never contain raw text. Plurals and interpolation use small typed functions (`resultsCount(n)`).

**Formatters** (`shared/lib/format.ts`), pure and deterministic:

- `formatCompactNumber(n)` → `999`, `1.2k`, `12.3k`, `1.2M`.
- `formatRelativeTime(isoDate, now)` → `just now`, `5m ago`, `3h ago`, `3d ago`, `2mo ago`, `1y ago`. The `now` argument keeps it testable.
- Unit labels come from `strings.ts`, so localising later replaces the implementation, not the callers.
- **The only `Intl` use:** one module-level `Intl.NumberFormat` for grouping the header count, created once and never per render or per row.
- No date library: domain dates are ISO strings (ADR-0008), and the arithmetic is trivial.

## Alternatives considered

- **`Intl.RelativeTimeFormat` / compact `Intl.NumberFormat`.** Missing or inconsistent on Hermes.
- **FormatJS polyfills.** Correct everywhere but heavy; worth it only with real multi-locale support.
- **date-fns / dayjs.** An extra dependency for about 20 lines of arithmetic.
- **An i18n library now** (i18next, Lingui). Premature for one locale. Swapping later is mechanical thanks to `strings.ts`.

## Consequences

Positive:

- Zero-dependency, fast formatting that behaves identically on both platforms.
- Fully tested, and ready for i18n.

Negative / accepted costs:

- English-style compact and relative formats only, until i18n arrives. Listed in "What I'd improve".

## Enforcement

- Lint bans string literals rendered directly inside `Text` (outside tests and `shared/i18n`).
- The `rn-review` skill flags `new Intl.*` inside components, render paths or rows.
- Formatter tests cover the boundaries (999 → 1k, 59 min → 1 h, …).

## References

- Hermes Intl support notes: https://medium.com/@iROOMitEng/hermes-intl-support-in-react-native-on-ios-134b487bcce7
