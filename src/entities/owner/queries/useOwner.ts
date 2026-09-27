import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { ownerKeys } from './ownerKeys';
import { fetchOwner } from '../api/fetchOwner';

// Profiles rarely change, and each fetch costs a core request (ADR-0012).
const OWNER_STALE_TIME_MS = 60 * 60 * 1000;

const ownerQueryOptions = (login: string | undefined) =>
  queryOptions({
    queryKey: ownerKeys.detail(login ?? ''),
    queryFn:
      login === undefined
        ? skipToken
        : ({ signal }) => fetchOwner(login, signal),
    staleTime: OWNER_STALE_TIME_MS,
  });

/**
 * An owner's profile, cached per owner for an hour (ADR-0007, ADR-0012).
 * `enabled: false` keeps showing a cached profile but never fetches, which is
 * how the core-budget reserve holds requests back.
 */
export function useOwner(
  login: string | undefined,
  { enabled }: { enabled: boolean },
) {
  return useQuery({ ...ownerQueryOptions(login), enabled });
}
