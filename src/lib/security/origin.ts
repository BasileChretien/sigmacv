/**
 * Defence-in-depth CSRF check for state-changing API routes.
 *
 * The primary CSRF control is the Auth.js session cookie's `SameSite=Lax`
 * attribute (a cross-site form/script POST never carries the cookie). This adds
 * a second, independent layer: a cross-site browser request always carries a
 * foreign `Origin` header, so we reject any request whose `Origin` (or, as a
 * fallback, `Referer`) doesn't match the app's own origin.
 *
 * The expected origin is `AUTH_URL` (the canonical production origin). When it
 * is unset (local dev), the check is permissive so local tooling isn't blocked —
 * `SameSite=Lax` still applies. Read straight from `process.env` (same rationale
 * as the research switches) and injectable for tests.
 */
function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isSameOrigin(
  req: Request,
  allowedOrigin: string | undefined = process.env.AUTH_URL,
): boolean {
  if (!allowedOrigin) return true; // dev / no canonical origin configured
  const expected = originOf(allowedOrigin);
  if (!expected) return true; // misconfigured AUTH_URL — don't hard-fail requests

  const origin = req.headers.get("origin");
  if (origin) return origin === expected;

  // Some same-origin programmatic requests omit Origin; fall back to Referer.
  const referer = req.headers.get("referer");
  if (referer) return originOf(referer) === expected;

  // Neither header present: not a cross-site browser form POST (those always
  // send Origin). Allow — SameSite=Lax remains the primary guard.
  return true;
}
