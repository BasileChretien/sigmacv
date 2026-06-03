import { NextResponse } from "next/server";
import { getPublicCv } from "@/lib/cv/sync";
import { renderCvHtml } from "@/lib/render/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, living CV page. Serves the self-contained CV HTML document (its own
 * styles + CSP) for a published slug. Returns 404 if the slug is unknown or
 * the owner has unpublished it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cv = await getPublicCv(slug);

  if (!cv) {
    return new NextResponse("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const html = renderCvHtml(cv);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Publishing exposes a capability URL the owner chooses to share. We do
      // NOT let search engines index it: that would put names/ORCID/publication
      // lists into Google with only a blanket publish toggle. Indexing requires
      // a future explicit, specific "allow indexing" consent (GDPR/APPI).
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=300",
    },
  });
}
