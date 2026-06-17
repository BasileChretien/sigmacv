import { getPublicCvForPage } from "@/lib/cv/sync";
import { isKnownMiss, rememberMiss } from "@/lib/cv/publicPageCache";
import { badgeSvg, parseBadgeOptions } from "@/lib/cv/badgeSvg";
import { signpostingLinkHeader } from "@/lib/cv/signposting";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SVG badge response with the page route's privacy/robots headers. */
function badgeResponse(svg: string, indexable: boolean, links: string): Response {
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // FAIR Signposting: the same typed links the page + machine formats carry,
      // so a crawler landing on the badge discovers the author pid, the machine
      // representations, the resource type, and the license from headers alone.
      Link: links,
      // Private + short TTL so an unpublished CV's badge can't linger in a
      // well-behaved shared/CDN cache (the badge resolves live, so an unpublish
      // 404s immediately). Third-party image proxies (e.g. GitHub Camo) cache on
      // their own terms; the badge carries only name/accent/coarse month — all
      // already-public — so brief proxy staleness is harmless and never sensitive.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      // Defence-in-depth: the SVG has no script/links/remote refs; only its own
      // inline <style> (the card theme). Lock everything else down for the case
      // where the .svg URL is opened top-level rather than embedded as <img>.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}

/**
 * Embeddable "Living CV" badge for the public living page (`/p/<slug>/badge.svg`).
 *
 * Looks the CV up via the SAME `getPublicCvForPage` path the page route uses and
 * 404s when it isn't published (fail closed — never renders an unpublished CV's
 * name). Variants come from validated query params (`style`, `theme`, `label`,
 * `color`); all branching lives in the tested `badgeSvg` / `parseBadgeOptions`
 * helpers. The SVG render is cheap string interpolation (unlike the citeproc HTML
 * or the rasterized OG PNG), so there is no in-process render cache: the rate
 * limit + negative miss-cache bound a random-slug flood, and resolving live keeps
 * unpublish immediate.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  // Same per-IP + global ceiling as the page route, sharing the `pubpage:`
  // buckets — this surface must not be an unthrottled bypass.
  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const notFound = () =>
    new Response("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  // Reject crafted slugs before the DB lookup (server slugs always match).
  if (!isValidPublicSlug(slug)) return notFound();
  if (isKnownMiss(slug)) return notFound();

  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const { cv, indexable } = record;
  const url = new URL(req.url);
  const opts = parseBadgeOptions({
    style: url.searchParams.get("style"),
    theme: url.searchParams.get("theme"),
    label: url.searchParams.get("label"),
    color: url.searchParams.get("color"),
  });

  return badgeResponse(badgeSvg(cv, opts), indexable, signpostingLinkHeader(cv, slug));
}
