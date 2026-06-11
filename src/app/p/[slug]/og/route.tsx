import { getPublicCvForPage } from "@/lib/cv/sync";
import {
  dedupeOgImage,
  getCachedOgImage,
  isKnownMiss,
  rememberMiss,
  setCachedOgImage,
} from "@/lib/cv/publicPageCache";
import { ogImageProps } from "@/lib/cv/ogImage";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";
import { renderCvOgImage } from "./card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OG PNG response with the page route's privacy/robots headers. */
function ogResponse(bytes: Uint8Array, indexable: boolean): Response {
  // A Uint8Array is a valid Response body at runtime; the cast only sidesteps the
  // generic-Uint8Array vs BodyInit friction in the current @types/node.
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // Private + short TTL so an unpublished CV's OG card can't linger in a
      // shared/CDN cache (the server-side cache is slug-invalidated on publish
      // changes). Matches the in-process OG cache TTL.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

/**
 * Per-CV Open Graph / social-share card for the public living page
 * (`/p/<slug>/og`). Looks the CV up via the SAME `getPublicCvForPage` path the
 * page route uses and 404s when it isn't published (fail closed — never renders
 * an unpublished CV's name). All display branching lives in the tested
 * `ogImageProps` helper; the layout JSX lives in the colocated `card.tsx`.
 *
 * Only default/system fonts are used — no remote font fetch — so the card stays
 * self-contained and fast. The robots posture mirrors the page route: the owner
 * opts into indexing per-CV; otherwise the image stays noindex.
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
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  // Reject crafted slugs before the DB lookup (server slugs always match).
  if (!isValidPublicSlug(slug)) return notFound();

  // Serve a cached card if present (the render is CPU-heavy; the cache is
  // slug-invalidated on any publish/unpublish/index change).
  const cached = getCachedOgImage(slug);
  if (cached) return ogResponse(cached.bytes, cached.indexable);

  if (isKnownMiss(slug)) return notFound();
  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const { cv, indexable } = record;

  // Single-flight the render so a burst of unfurl scrapers on one uncached slug
  // rasterizes the PNG once, then serves the cached bytes.
  const entry = await dedupeOgImage(slug, async () => {
    const fresh = getCachedOgImage(slug);
    if (fresh) return fresh;
    const image = renderCvOgImage(ogImageProps(cv));
    const bytes = new Uint8Array(await image.arrayBuffer());
    const e = { bytes, indexable };
    setCachedOgImage(slug, e);
    return e;
  });
  return ogResponse(entry.bytes, entry.indexable);
}
