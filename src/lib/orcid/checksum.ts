/**
 * ORCID iD check-digit validation (ISO 7064 MOD 11-2).
 *
 * The last character of an ORCID iD is a checksum over the first 15 digits, so a
 * single mistyped digit is almost always detectable. The app's tolerant
 * `normalizeOrcid` only enforces the *shape*; this catches typos that are
 * well-formed but not real iDs — used to reject them up front (before any network
 * work) on the user-typed no-login preview path.
 *
 * Pure + dependency-free so it is safe to import into a client component.
 */
export function isValidOrcidChecksum(orcid: string): boolean {
  const chars = orcid.replace(/-/g, "").toUpperCase();
  // 15 base digits + a check char that is a digit or `X`.
  if (!/^\d{15}[\dX]$/.test(chars)) return false;
  let total = 0;
  for (let i = 0; i < 15; i++) {
    total = (total + Number(chars[i])) * 2;
  }
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const check = result === 10 ? "X" : String(result);
  return check === chars[15];
}
