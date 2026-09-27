import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import { RepoCardSkeleton, type RepoSummary } from '@/entities/repo';
import {
  RateLimitBanner,
  SearchErrorState,
  SearchSuggestions,
  SortPicker,
  useRecentSearches,
  useRepoSearch,
  type SearchSort,
  type SearchView,
} from '@/features/search-repos';
import { strings } from '@/shared/i18n';
import { assertNever } from '@/shared/lib';
import { Divider, OfflineBanner, SearchField, StateView } from '@/shared/ui';

import { useStyles } from './SearchScreen.styles';
import { SearchResultsList } from './ui/SearchResultsList';

const SKELETON_ROWS = 8;
const skeletonKeys = Array.from({ length: SKELETON_ROWS }, (_, i) => i);

/**
 * Search: type to search GitHub, results as you go (ADR-0012 budget rules
 * live in `useRepoSearch`). Composes the search feature with the repo entity.
 */
export function SearchScreen() {
  const navigation = useNavigation();
  const styles = useStyles();
  const recent = useRecentSearches(state => state.queries);
  const addRecent = useRecentSearches(state => state.add);
  const removeRecent = useRecentSearches(state => state.remove);
  const [text, setText] = useState('');
  const [sort, setSort] = useState<SearchSort>('best-match');
  // Focus the field only for someone who has never searched; everyone else
  // sees their recent searches first instead of a keyboard.
  const [autoFocus] = useState(recent.length === 0);
  const search = useRepoSearch(text, sort);

  const searchFor = (query: string) => {
    setText(query);
    search.submit(query);
  };

  const openRepo = (repo: RepoSummary) => {
    // Opening a result is the signal that the query was worth remembering.
    if (search.params !== undefined) addRecent(search.params.query);
    navigation.navigate('RepoDetails', {
      owner: repo.owner.login,
      name: repo.name,
    });
  };

  const renderContent = (view: SearchView) => {
    switch (view.kind) {
      case 'idle':
        return (
          <SearchSuggestions
            recent={recent}
            onSelect={searchFor}
            onRemove={removeRecent}
          />
        );
      case 'loading':
        return (
          // The search field's spinner announces loading; this is visual.
          <View testID="search-skeleton">
            {skeletonKeys.map(key => (
              <View key={key}>
                <RepoCardSkeleton />
                <Divider />
              </View>
            ))}
          </View>
        );
      case 'offline':
        return (
          <StateView
            icon="cloud-offline"
            title={strings.search.offline.title}
            message={strings.search.offline.message}
          />
        );
      case 'error':
        return <SearchErrorState error={view.error} onRetry={search.retry} />;
      case 'empty':
        return (
          <StateView
            icon="search"
            title={strings.search.empty.title(view.query)}
            message={strings.search.empty.message}
          />
        );
      case 'results':
        return (
          <SearchResultsList
            search={search}
            view={view}
            onPressRepo={openRepo}
          />
        );
      default:
        return assertNever(view);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <SearchField
          value={text}
          onChangeText={setText}
          onSubmit={search.submit}
          placeholder={strings.search.placeholder}
          clearLabel={strings.search.clear}
          autoFocus={autoFocus}
          loading={search.isPending}
          loadingLabel={strings.search.loading}
        />
        {search.params !== undefined ? (
          <SortPicker value={sort} onChange={setSort} />
        ) : null}
      </View>
      <OfflineBanner />
      {search.rateLimitResetAt !== undefined ? (
        <RateLimitBanner resetAt={search.rateLimitResetAt} />
      ) : null}
      <View style={styles.content}>{renderContent(search.view)}</View>
    </View>
  );
}
