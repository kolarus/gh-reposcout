/** The owner entity: a user's or organisation's public profile (ADR-0005). */
export type { OwnerProfile } from './model/types';
export { fetchOwnerProfile, useOwner } from './queries/useOwner';
export { OwnerCard, type OwnerSection } from './ui/OwnerCard';
