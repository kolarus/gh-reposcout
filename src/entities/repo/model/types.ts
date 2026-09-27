/** The owner as far as a repository needs it; full profiles are `entities/owner`. */
interface RepoOwnerRef {
  login: string;
  /** Original URL; size it for display with `sizedAvatarUrl`. */
  avatarUrl: string;
  kind: 'user' | 'organization';
}

/**
 * A repository (ADR-0008): camelCase, no nulls, dates as ISO strings formatted
 * only in the view (ADR-0019). The same type whether it came from search or
 * from `GET /repos/{owner}/{name}`.
 */
export interface RepoDetails {
  id: number;
  owner: RepoOwnerRef;
  name: string;
  /** `owner/name`, as GitHub spells it. */
  fullName: string;
  description: string | undefined;
  htmlUrl: string;
  /** Only an `https:` link; anything else from GitHub is dropped. */
  homepageUrl: string | undefined;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | undefined;
  /** SPDX id such as "MIT", or the license's name when it has none. */
  license: string | undefined;
  topics: string[];
  defaultBranch: string;
  sizeKb: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | undefined;
}
