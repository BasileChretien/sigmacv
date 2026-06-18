import { getPublicCvForPage } from "@/lib/cv/sync";
import { isKnownMiss, rememberMiss } from "@/lib/cv/publicPageCache";
import { renderCvAtomFeed } from "@/lib/cv/feed";
import { signpostingLinkHeader } from "@/lib/cv/signposting";
import { SITE_URL } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(): Response {
  return new Response("This feed is not available.", {
    status: 404,
    // no-store so a 404 for a not-yet-published slug is never cached by an
    // intermediary — the feed must appear immediately once the owner publishes.
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Atom feed of a published living CV's research outputs (`/p/<slug>/feed.xml`) — the
 * public "follow my research" primitive. Resolves the CV via the SAME
 * `getPublicCvForPage` path (fail closed: 404 when not published) and serializes the
 * already-public-projected CV with the tested `renderCvAtomFeed`. No render cache:
 * the feed is cheap string interpolation and resolves live so an unpublish takes
 * effect immediately; the rate limit + negative miss-cache bound a random-slug flood.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  if (!isValidPublicSlug(slug)) return notFound();
  if (isKnownMiss(slug)) return notFound();

  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const { cv, indexable } = record;
  const xml = renderCvAtomFeed(cv, slug, SITE_URL);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      // FAIR Signposting: the same typed links the page + machine formats carry.
      Link: signpostingLinkHeader(cv, slug),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
