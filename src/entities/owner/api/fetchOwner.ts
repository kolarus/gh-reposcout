import { githubClient } from '@/shared/api';

import { ownerSchema } from './owner.schema';
import { toOwnerProfile } from '../model/mappers';
import type { OwnerProfile } from '../model/types';

/** `GET /users/{login}`: one core request (ADR-0012). */
export async function fetchOwner(
  login: string,
  signal?: AbortSignal,
): Promise<OwnerProfile> {
  const dto = await githubClient.get(
    `/users/${encodeURIComponent(login)}`,
    ownerSchema,
    { signal },
  );
  return toOwnerProfile(dto);
}
