import { useScrollToTop } from '@react-navigation/native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import { RefreshControl, View } from 'react-native';

import { RepoCard, type RepoDetails } from '@/entities/repo';
import { SaveToggle } from '@/features/save-repo';
import {
  reachedResultCap,
  ResultsHeader,
  SearchFooter,
  type RepoSearch,
  type SearchView,
} from '@/features/search-repos';
import { haptics, useNow } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Divider } from '@/shared/ui';

import { useStyles } from './SearchResultsList.styles';

type Results = Extract<SearchView, { kind: 'results' }>;

interface SearchResultsListProps {
  search: RepoSearch;
  view: Results;
  onPressRepo: (repo: RepoDetails) => void;
}

const keyExtractor = (repo: RepoDetails) => String(repo.id);
// FlashList keeps the first visible row in place when data changes. That's for
// lists that grow at the top; here a new sort would open one row down.
const MVCP_OFF = { disabled: true } as const;

/**
 * The results list (ADR-0009): FlashList recycling, one press handler shared
 * by every row, pages loaded near the end, pull-to-refresh back to page 1.
 * While it shows a previous search's results (`isStale`), they're veiled and
 * inert: rows can't be opened, and the list doesn't scroll or refresh.
 */
export function SearchResultsList({
  search,
  view,
  onPressRepo,
}: SearchResultsListProps) {
  const theme = useTheme();
  const styles = useStyles();
  const listRef = useRef<FlashListRef<RepoDetails>>(null);
  // Re-renders the rows once a minute, so "Updated 3m ago" stays true.
  const now = useNow(60_000);
  useScrollToTop(listRef);

  // A new query or sort starts at the top, not where the old list was.
  const searchKey = `${search.params?.sort ?? ''}:${search.params?.query ?? ''}`;
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [searchKey]);

  const { isStale } = view;
  // FlashList re-renders visible rows when this changes.
  const rowState = { now, isStale };

  return (
    <View style={styles.container} accessibilityState={{ busy: isStale }}>
      <FlashList
        ref={listRef}
        data={view.results.repos}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <RepoCard
            repo={item}
            now={now}
            onPress={onPressRepo}
            disabled={isStale}
            // A slot (ADR-0005): the repo entity doesn't know about saving.
            accessory={<SaveToggle repo={item} />}
          />
        )}
        extraData={rowState}
        scrollEnabled={!isStale}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={<ResultsHeader results={view.results} />}
        ListFooterComponent={
          <SearchFooter
            isFetchingNextPage={search.isFetchingNextPage}
            hasNextPage={search.hasNextPage}
            nextPageError={search.nextPageError}
            reachedCap={reachedResultCap(view.results)}
            onRetry={search.retry}
          />
        }
        onEndReached={search.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            enabled={!isStale}
            refreshing={search.isRefreshing}
            onRefresh={() => {
              haptics.impact();
              void search.refresh();
            }}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        maintainVisibleContentPosition={MVCP_OFF}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />
      {isStale ? (
        <View testID="stale-results" style={styles.staleVeil} />
      ) : null}
    </View>
  );
}
