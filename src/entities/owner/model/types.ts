/** A user's or organisation's public profile (ADR-0008). */
export interface OwnerProfile {
  login: string;
  name: string | undefined;
  avatarUrl: string;
  htmlUrl: string;
  kind: 'user' | 'organization';
  bio: string | undefined;
  company: string | undefined;
  location: string | undefined;
  /** Only an `https:` link. */
  blogUrl: string | undefined;
  followers: number;
  publicRepos: number;
}
