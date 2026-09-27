const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const HTTPS_URL = /^https:\/\/[^\s/?#.][^\s]*$/i;

/**
 * A user-supplied link as one we're willing to open, or `undefined`. Such
 * fields (a repo's homepage, a profile's blog) can hold anything, so only
 * `https:` is allowed: no `http:`, `javascript:` or app schemes. A bare domain
 * such as "reactnative.dev" gets `https://` in front.
 */
export function toSafeHttpsUrl(
  raw: string | null | undefined,
): string | undefined {
  const value = raw?.trim() ?? '';
  if (value === '') return undefined;
  const url = HAS_SCHEME.test(value) ? value : `https://${value}`;
  return HTTPS_URL.test(url) ? url : undefined;
}
