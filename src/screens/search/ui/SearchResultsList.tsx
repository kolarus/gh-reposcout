import { useScrollToTop } from '@react-navigation/native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';
import { RefreshControl, View } from 'react-native';

import { RepoCard, type RepoSummary } from '@/entities/repo';
import {
  reachedResultCap,
  ResultsHeader,
  SearchFooter,
  type RepoSearch,
  type SearchView,
} from '@/features/search-repos';
import { useNow } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Divider } from '@/shared/ui';

import { useStyles } from './SearchResultsList.styles';

type Results = Extract<SearchView, { kind: 'results' }>;

interface SearchResultsListProps {
  search: RepoSearch;
  view: Results;
  onPressRepo: (repo: RepoSummary) => void;
}

const keyExtractor = (repo: RepoSummary) => String(repo.id);
// FlashList keeps the first visible row in place when data changes. That's for
// lists that grow at the top; here a new sort would open one row down.
const MVCP_OFF = { disabled: true } as const;

/**
 * The results list (ADR-0009): FlashList recycling, one press handler shared
 * by every row, pages loaded near the end, pull-to-refresh back to page 1.
 */
export function SearchResultsList({
  search,
  view,
  onPressRepo,
}: SearchResultsListProps) {
  const theme = useTheme();
  const styles = useStyles();
  const listRef = useRef<FlashListRef<RepoSummary>>(null);
  // Re-renders the rows once a minute, so "Updated 3m ago" stays true.
  const now = useNow(60_000);
  useScrollToTop(listRef);

  // A new query or sort starts at the top, not where the old list was.
  const searchKey = `${search.params?.sort ?? ''}:${search.params?.query ?? ''}`;
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [searchKey]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={view.results.repos}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <RepoCard repo={item} now={now} onPress={onPressRepo} />
        )}
        extraData={now}
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
            refreshing={search.isRefreshing}
            onRefresh={() => {
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
      {view.isStale ? (
        <View testID="stale-results" style={styles.staleVeil} />
      ) : null}
    </View>
  );
}
