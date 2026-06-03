import { NextResponse } from "next/server";
import { getPublicCvForPage } from "@/lib/cv/sync";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { renderCvHtml } from "@/lib/render/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, living CV page. Serves the self-contained CV HTML document (its own
 * styles + CSP) for a published slug. Returns 404 if the slug is unknown or
 * the owner has unpublished it.
 *
 * Indexing is a SEPARATE per-CV opt-in (publicIndexable): by default the page
 * is noindex (publishing only shares a capability URL); when the owner opts in,
 * we allow indexing and embed ProfilePage/Person JSON-LD for rich results.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const record = await getPublicCvForPage(slug);

  if (!record) {
    return new NextResponse("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { cv, indexable } = record;
  let html = renderCvHtml(cv);
  if (indexable) {
    // Inject ProfilePage/Person JSON-LD into the document head for rich results.
    // It's data (not executed), so it's unaffected by the document's strict CSP.
    const jsonLd = `<script type="application/ld+json">${profilePageJsonLd(
      cv,
      slug,
    )}</script>`;
    html = html.replace("</head>", `${jsonLd}</head>`);
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Indexing requires the owner's explicit, separate opt-in. Without it the
      // page stays noindex so names/ORCID/publications don't enter search
      // engines on a blanket publish toggle (GDPR/APPI).
      "X-Robots-Tag": indexable
        ? "index, follow"
        : "noindex, nofollow",
      // Personal data + a living page: never cache in a shared/CDN layer so an
      // unpublish/unindex takes effect immediately.
      "Cache-Control": "private, no-store",
    },
  });
}
