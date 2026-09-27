/** The repository entity: data, mapping and presentation of a GitHub repo (ADR-0005). */
export { repoSummarySchema } from './api/repo.schema';
export { toRepoSummary } from './model/mappers';
export { isValidRepoRef } from './model/repoRef';
export type { RepoSummary } from './model/types';
export { RepoCard } from './ui/RepoCard';
export { RepoCardSkeleton } from './ui/RepoCardSkeleton';
