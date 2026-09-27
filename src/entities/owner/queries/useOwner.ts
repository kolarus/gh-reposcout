import {
  queryOptions,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';

import { ownerKeys } from './ownerKeys';
import { fetchOwner } from '../api/fetchOwner';
import type { OwnerProfile } from '../model/types';

// Profiles rarely change, and each fetch costs a core request (ADR-0012).
const OWNER_STALE_TIME_MS = 60 * 60 * 1000;

const ownerQueryOptions = (login: string) =>
  queryOptions({
    queryKey: ownerKeys.detail(login),
    queryFn: ({ signal }) => fetchOwner(login, signal),
    staleTime: OWNER_STALE_TIME_MS,
  });

/**
 * An owner's profile, cached per owner for an hour (ADR-0007, ADR-0012).
 * `enabled: false` keeps showing a cached profile but never fetches, which is
 * how the core-budget reserve holds requests back. Without a login yet, it
 * waits.
 */
export function useOwner(
  login: string | undefined,
  { enabled }: { enabled: boolean },
) {
  return useQuery({
    ...ownerQueryOptions(login ?? ''),
    enabled: enabled && login !== undefined,
  });
}

/**
 * An owner's profile outside React (e.g. completing a saved snapshot in the
 * background), through the same per-owner cache: no request while it's fresh.
 */
export function fetchOwnerProfile(
  queryClient: QueryClient,
  login: string,
): Promise<OwnerProfile> {
  return queryClient.query(ownerQueryOptions(login));
}
