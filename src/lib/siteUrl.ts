/**
 * Canonical public origin of the deployment, used for SEO (canonical URLs,
 * hreflang, sitemap, robots, Open Graph, JSON-LD). Driven by env so the real
 * production domain is never hard-coded; falls back to a placeholder in dev.
 *
 * Set `NEXT_PUBLIC_SITE_URL` (e.g. https://sigmacv.org) in the deployment env.
 */

const FALLBACK_SITE_URL = "https://sigmacv.org";

/** Resolve + normalize a site origin (strips trailing slashes). */
export function resolveSiteUrl(
  raw: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const value = (raw ?? "").trim();
  const base = value.length > 0 ? value : FALLBACK_SITE_URL;
  return base.replace(/\/+$/, "");
}

/** The resolved origin, e.g. "https://sigmacv.org" (no trailing slash). */
export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a path: absoluteUrl("/fr") -> "https://sigmacv.org/fr". */
export function absoluteUrl(path = "/"): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${SITE_URL}/${clean}` : `${SITE_URL}/`;
}
