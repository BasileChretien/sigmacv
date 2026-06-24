import { getPublicCvForPage } from "@/lib/cv/sync";
import {
  dedupeBadgePng,
  getCachedBadgePng,
  isKnownMiss,
  rememberMiss,
  setCachedBadgePng,
} from "@/lib/cv/publicPageCache";
import { ogImageProps } from "@/lib/cv/ogImage";
import { syncedLabel } from "@/lib/cv/badgeSvg";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";
import { renderEmailBadge } from "./card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The brand label baked into the email badge (matches the SVG badge default). */
const EMAIL_BADGE_LABEL = "Living CV";

/** PNG response with the page route's privacy/robots headers. */
function pngResponse(bytes: Uint8Array, indexable: boolean): Response {
  // A Uint8Array is a valid Response body at runtime; the cast only sidesteps the
  // generic-Uint8Array vs BodyInit friction in the current @types/node.
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Private + short TTL so an unpublished CV's badge can't linger in a
      // shared/CDN cache (the server-side cache is slug-invalidated on publish
      // changes, and the live lookup 404s immediately on unpublish). Matches the
      // in-process badge cache TTL.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

/**
 * Outlook-safe raster "Living CV" badge for an email signature
 * (`/p/<slug>/badge.png`). Looks the CV up via the SAME `getPublicCvForPage`
 * path the page route uses and 404s when it isn't published (fail closed — never
 * renders an unpublished CV's name). All display branching lives in the tested
 * `ogImageProps` helper; the layout JSX lives in the colocated `card.tsx`.
 *
 * Structurally identical to the OG card route (rate limit + server cache +
 * single-flight) because a signature image can be re-fetched by every recipient
 * who opens the email — the render must never run more than once per slug/TTL.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  // Same per-IP + global ceiling as the page route, sharing the `pubpage:`
  // buckets — this render-heavy surface must not be an unthrottled bypass.
  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const notFound = () =>
    new Response("This CV is not available.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });

  // Reject crafted slugs before the DB lookup (server slugs always match).
  if (!isValidPublicSlug(slug)) return notFound();

  // Serve a cached badge if present (the render is CPU-heavy; the cache is
  // slug-invalidated on any publish/unpublish/index change).
  const cached = getCachedBadgePng(slug);
  if (cached) return pngResponse(cached.bytes, cached.indexable);

  if (isKnownMiss(slug)) return notFound();
  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const { cv, indexable } = record;

  // Single-flight the render so a burst of recipients opening the same signature
  // image rasterizes the PNG once, then serves the cached bytes.
  const entry = await dedupeBadgePng(slug, async () => {
    const fresh = getCachedBadgePng(slug);
    if (fresh) return fresh;
    const image = renderEmailBadge({
      props: ogImageProps(cv),
      label: EMAIL_BADGE_LABEL,
      synced: syncedLabel(cv.provenance.lastSyncedAt ?? cv.provenance.generatedAt),
    });
    const bytes = new Uint8Array(await image.arrayBuffer());
    const e = { bytes, indexable };
    setCachedBadgePng(slug, e);
    return e;
  });
  return pngResponse(entry.bytes, entry.indexable);
}
