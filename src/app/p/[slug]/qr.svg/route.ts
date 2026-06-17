import { getPublicCvForPage } from "@/lib/cv/sync";
import { isKnownMiss, rememberMiss } from "@/lib/cv/publicPageCache";
import { qrSvg } from "@/lib/cv/qrSvg";
import { absoluteUrl } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** QR SVG response with the page route's privacy/robots headers. */
function qrResponse(svg: string, indexable: boolean): Response {
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Same posture as the badge: private + short TTL so an unpublished CV's QR
      // can't linger in a well-behaved shared cache (it resolves live → unpublish
      // 404s at once). The QR only encodes the public page URL — nothing sensitive.
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      // The QR SVG has no script, no <style>, no remote refs — lock it all down.
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

/**
 * QR code for the public living page (`/p/<slug>/qr.svg`) — for posters, slides,
 * and business cards. Mirrors the badge route: shared rate-limit + negative
 * cache, slug validation before any lookup, and a fail-closed 404 for
 * unpublished/unknown CVs. It encodes ONLY the canonical absolute page URL (built
 * server-side from the already-validated slug), so it carries no CV data at all.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const notFound = () =>
    new Response("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  if (!isValidPublicSlug(slug)) return notFound();
  if (isKnownMiss(slug)) return notFound();

  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  return qrResponse(qrSvg(absoluteUrl(`/p/${slug}`)), record.indexable);
}
