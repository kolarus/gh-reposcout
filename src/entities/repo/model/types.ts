/** The owner as far as a repository needs it; full profiles are `entities/owner`. */
interface RepoOwnerRef {
  login: string;
  /** Original URL; size it for display with `sizedAvatarUrl`. */
  avatarUrl: string;
}

/** A repository as shown in lists (ADR-0008): camelCase, no nulls. */
export interface RepoSummary {
  id: number;
  owner: RepoOwnerRef;
  name: string;
  /** `owner/name`, as GitHub spells it. */
  fullName: string;
  description: string | undefined;
  stars: number;
  language: string | undefined;
  /** ISO-8601; formatted only in the view (ADR-0019). */
  updatedAt: string;
}
