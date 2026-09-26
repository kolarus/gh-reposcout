/** Identifies a repository by owner login and name, as used in routes and deep links. */
export interface RepoRef {
  owner: string;
  name: string;
}

// GitHub logins: 1–39 characters, letters/digits and single inner hyphens.
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
// Repository names: 1–100 characters of letters, digits, '.', '-', '_'.
const REPO_NAME = /^[\w.-]{1,100}$/;

/**
 * Validates route/deep-link params before any request is made (ADR-0006), so a
 * malformed link shows "not found" instead of calling GitHub with garbage.
 */
export function isValidRepoRef({ owner, name }: RepoRef): boolean {
  return (
    LOGIN.test(owner) && REPO_NAME.test(name) && name !== '.' && name !== '..'
  );
}
