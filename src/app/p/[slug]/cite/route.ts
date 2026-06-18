import { getPublicCvForPage } from "@/lib/cv/sync";
import { isKnownMiss, rememberMiss } from "@/lib/cv/publicPageCache";
import { citeItem, isCiteFormat } from "@/lib/cv/citeItem";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../pubRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(): Response {
  return new Response("This citation is not available.", {
    status: 404,
    // no-store so a 404 for a not-yet-published slug is never cached by an
    // intermediary — the citation must resolve immediately once the owner publishes.
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Per-publication citation download for the public living page's "Cite" affordance
 * (`/p/<slug>/cite?id=<itemId>&format=bibtex|ris|csljson`).
 *
 * Resolves the CV via the SAME `getPublicCvForPage` path (so it 404s when the page
 * isn't published — fail closed) and serializes ONE work to the requested format
 * via the tested `citeItem`. `citeItem` runs on the public projection, so a hidden
 * / "not mine" / per-view-excluded work isn't found → 404; the affordance can only
 * cite a work actually shown on the page. The `id` is matched exactly (no
 * injection); the Content-Disposition filename uses the validated slug, never the id.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  // Same per-IP + global ceiling as the page route (shared `pubpage:` buckets).
  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  if (!isValidPublicSlug(slug)) return notFound();
  if (isKnownMiss(slug)) return notFound();

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const format = (url.searchParams.get("format") ?? "bibtex").toLowerCase();
  if (!id || !isCiteFormat(format)) return notFound();

  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const cited = citeItem(record.cv, id, format);
  if (!cited) return notFound();

  return new Response(cited.body, {
    status: 200,
    headers: {
      "Content-Type": cited.contentType,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": record.indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": `attachment; filename="${slug}-citation.${cited.extension}"`,
      // A pure text download with no scripts/links — lock everything down.
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
