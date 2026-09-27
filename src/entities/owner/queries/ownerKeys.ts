/** Query keys for owner profiles (ADR-0007). Never write them inline. */
export const ownerKeys = {
  all: ['owner'] as const,
  // Lowercased: GitHub logins are case-insensitive.
  detail: (login: string) =>
    [...ownerKeys.all, 'detail', login.toLowerCase()] as const,
};
