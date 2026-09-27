/** Search GitHub repositories: query, pagination, recent searches and their UI (ADR-0005). */
export type { SearchSort } from './model/searchParams';
export { reachedResultCap } from './model/searchResults';
export type { SearchView } from './model/searchView';
export { useRecentSearches } from './store/recentSearches';
export { useRepoSearch, type RepoSearch } from './queries/useRepoSearch';
export { RateLimitBanner } from './ui/RateLimitBanner';
export { ResultsHeader } from './ui/ResultsHeader';
export { SearchErrorState } from './ui/SearchErrorState';
export { SearchFooter } from './ui/SearchFooter';
export { SearchSuggestions } from './ui/SearchSuggestions';
export { SortPicker } from './ui/SortPicker';
