/** The repository entity: data, mapping and presentation of a GitHub repo (ADR-0005). */
export { repoSchema } from './api/repo.schema';
export { toRepoDetails } from './model/mappers';
export { isValidRepoRef, type RepoRef } from './model/repoRef';
export type { RepoDetails } from './model/types';
export { seedRepoDetail, useRepository } from './queries/repoQuery';
export { RepoCard } from './ui/RepoCard';
export { RepoCardSkeleton } from './ui/RepoCardSkeleton';
export { RepoDetailsSkeleton } from './ui/RepoDetailsSkeleton';
export { RepoHero } from './ui/RepoHero';
export { RepoStats } from './ui/RepoStats';
