/**
 * Defence-in-depth CSRF check for state-changing API routes.
 *
 * The primary CSRF control is the Auth.js session cookie's `SameSite=Lax`
 * attribute (a cross-site form/script POST never carries the cookie). This adds
 * a second, independent layer: a cross-site browser request always carries a
 * foreign `Origin` header, so we reject any request whose `Origin` (or, as a
 * fallback, `Referer`) doesn't match the app's own origin.
 *
 * The expected origin is `AUTH_URL` (the canonical production origin), which
 * `env.ts` makes mandatory in production. This check FAILS CLOSED in production:
 * if no canonical origin resolves, or the request carries neither `Origin` nor
 * `Referer` (modern browsers always send `Origin` on POST/PATCH/DELETE), it is
 * rejected — a misconfigured `AUTH_URL` must not silently disable the layer. In
 * dev (non-production, `AUTH_URL` typically unset) it stays permissive so local
 * tooling isn't blocked; `SameSite=Lax` remains the primary guard either way.
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
  const isProd = process.env.NODE_ENV === "production";
  const expected = allowedOrigin ? originOf(allowedOrigin) : null;
  if (!expected) {
    // No canonical origin configured (or unparseable). Permissive in dev; fail
    // closed in production so a misconfig can't disable this CSRF layer.
    return !isProd;
  }

  const origin = req.headers.get("origin");
  if (origin) return origin === expected;

  // Some same-origin programmatic requests omit Origin; fall back to Referer.
  const referer = req.headers.get("referer");
  if (referer) return originOf(referer) === expected;

  // Neither header present. A genuine cross-site browser POST/PATCH/DELETE always
  // sends Origin, so a header-less mutating request is untrusted in production.
  return !isProd;
}
