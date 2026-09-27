import { toSafeHttpsUrl } from '@/shared/lib';

import type { OwnerProfile } from './types';
import type { OwnerDto } from '../api/owner.schema';

/** GitHub's shape → ours: camelCase, `null` and blank text → `undefined`. */
export function toOwnerProfile(dto: OwnerDto): OwnerProfile {
  return {
    login: dto.login,
    name: nonBlank(dto.name),
    avatarUrl: dto.avatar_url,
    htmlUrl: dto.html_url,
    kind: dto.type === 'Organization' ? 'organization' : 'user',
    bio: nonBlank(dto.bio),
    company: nonBlank(dto.company),
    location: nonBlank(dto.location),
    blogUrl: toSafeHttpsUrl(dto.blog),
    followers: dto.followers,
    publicRepos: dto.public_repos,
  };
}

const nonBlank = (value: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
};
