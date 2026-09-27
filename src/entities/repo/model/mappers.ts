import type { RepoSummary } from './types';
import type { RepoSummaryDto } from '../api/repo.schema';

/** GitHub's shape → ours: camelCase, `null` → `undefined`, blank text dropped. */
export function toRepoSummary(dto: RepoSummaryDto): RepoSummary {
  return {
    id: dto.id,
    owner: { login: dto.owner.login, avatarUrl: dto.owner.avatar_url },
    name: dto.name,
    fullName: dto.full_name,
    description: nonBlank(dto.description),
    stars: dto.stargazers_count,
    language: nonBlank(dto.language),
    updatedAt: dto.updated_at,
  };
}

const nonBlank = (value: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
};
