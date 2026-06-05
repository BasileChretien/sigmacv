/**
 * Strip provider bearer tokens from a linked OAuth account before it is
 * persisted by the Auth.js Prisma adapter.
 *
 * We never use the access / refresh / id tokens after sign-in (publications come
 * from the public OpenAlex API via the iD, and sessions are database-backed), so
 * we drop them rather than store long-lived bearer credentials unencrypted at
 * rest. `expires_at` is also cleared — ORCID's ~20-year expiry (epoch seconds)
 * overflows the 32-bit `Account.expires_at` Int column.
 *
 * Applied via `adapter.linkAccount` in `src/auth.ts`; kept here as a PURE,
 * unit-tested function so a future next-auth/adapter upgrade or refactor can't
 * silently regress the invariant (a removed call fails the test, not at runtime).
 */
export function stripAccountTokens<T extends object>(account: T): T {
  return {
    ...account,
    access_token: undefined,
    refresh_token: undefined,
    id_token: undefined,
    expires_at: undefined,
  };
}
