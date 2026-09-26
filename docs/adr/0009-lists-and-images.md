# 0009. FlashList v2 for lists; core Image with server-resized avatars

- Status: accepted
- Date: 2026-09-26
- Related: ADR-0014, ADR-0017, ADR-0020

## Context

The brief evaluates "smooth 60 FPS scrolling, low memory". Search returns 100 items per page and up to 1,000 per query, and every row has an avatar.

GitHub serves avatars at about 420–460 px (about 30 KB) by default, and supports resizing through the `s=<px>` query parameter (roughly 90% smaller). The app shows only small avatars; it isn't image-heavy.

## Decision

**Lists: FlashList v2** (New Architecture only; no size estimates needed).

- `keyExtractor` = repo `id`. `getItemType` separates rows from the footer and skeleton variants.
- **Rows keep a fixed shape:** description clamped to 2 lines, single-line metadata. Layout is predictable, with little re-measuring.
- Row components get stable props and no inline closures (React Compiler plus one `onPressRepo(id)` handler, ADR-0014).
- No per-row `elevation` or shadows; hairline separators instead.
- Infinite scroll: `onEndReachedThreshold` about 0.5–1 screen, guarded with `isFetchingNextPage` / `hasNextPage`.

**Images: React Native's core `Image`**, wrapped in `shared/ui/Avatar`.

- The URL is rebuilt with `s = size × PixelRatio`.
- `key` is set to the URL, so a recycled row never flashes the previous avatar.
- An initials placeholder sits underneath.
- `fadeDuration={0}` on Android.
- `cache="force-cache"` on iOS, which serves a cached copy regardless of HTTP max-age.
- Android relies on Fresco's memory and disk cache.
- Offline avatars for saved repos are handled separately (ADR-0020), not by the image cache.
- **FastImage is deferred.** We'll consider it only if profiling (ADR-0017) shows image loading or caching as a bottleneck. We don't add a library because it says "Fast" in its name.

## Alternatives considered

- **FlatList.** Its windowing creates and destroys row components during fast scrolling, so it drops more frames and uses more memory than FlashList's recycling.
- **LegendList.** Promising, but a younger ecosystem; FlashList v2 is the established default.
- **`@d11/react-native-fast-image`** (maintained FastImage fork). An extra native dependency. Its size-limited cache (oldest entries evicted) still can't _guarantee_ offline avatars, and our small avatars don't need its caching.
- **expo-image.** Excellent, but needs Expo modules (ADR-0002).

## Consequences

Positive:

- Recycling list and small, correctly sized images keep scrolling smooth and memory low.
- No native image dependency.

Negative / accepted costs:

- iOS core image caching is weaker than SDWebImage. That's acceptable for thumbnails, and we'll revisit only if measurements show a problem.
- FlashList v2 means the New Architecture only (already mandatory in React Native 0.87).

## Enforcement

- `no-restricted-imports`: `FlatList` banned; React Native `Image` banned outside `shared/ui/Avatar`.
- The `rn-review` skill flags unsized images, unstable row props and variable-height content in rows.
- Performance metrics are recorded per ADR-0017.

## References

- https://shopify.github.io/flash-list/
- GitHub avatar `s` parameter: https://github.com/lepture/github-cards/issues/23
