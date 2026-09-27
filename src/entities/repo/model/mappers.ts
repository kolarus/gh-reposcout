import { toSafeHttpsUrl } from '@/shared/lib';

import type { RepoDetails } from './types';
import type { RepoDto } from '../api/repo.schema';

/** GitHub's shape → ours: camelCase, `null` → `undefined`, blank text dropped. */
export function toRepoDetails(dto: RepoDto): RepoDetails {
  return {
    id: dto.id,
    owner: {
      login: dto.owner.login,
      avatarUrl: dto.owner.avatar_url,
      kind: dto.owner.type === 'Organization' ? 'organization' : 'user',
    },
    name: dto.name,
    fullName: dto.full_name,
    description: nonBlank(dto.description),
    htmlUrl: dto.html_url,
    homepageUrl: toSafeHttpsUrl(dto.homepage),
    stars: dto.stargazers_count,
    forks: dto.forks_count,
    openIssues: dto.open_issues_count,
    language: nonBlank(dto.language),
    license: licenseLabel(dto.license),
    topics: dto.topics,
    defaultBranch: dto.default_branch,
    sizeKb: dto.size,
    archived: dto.archived,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    pushedAt: dto.pushed_at ?? undefined,
  };
}

const nonBlank = (value: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
};

// GitHub reports custom licenses as SPDX "NOASSERTION" with the name "Other".
const licenseLabel = (license: RepoDto['license']): string | undefined => {
  if (license === null) return undefined;
  const spdx = license.spdx_id;
  return spdx !== null && spdx !== 'NOASSERTION' ? spdx : license.name;
};
