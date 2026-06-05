import { ImageResponse } from "next/og";
import { getPublicCvForPage } from "@/lib/cv/sync";
import { ogImageProps } from "@/lib/cv/ogImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

/**
 * Per-CV Open Graph / social-share card for the public living page
 * (`/p/<slug>/og`). Looks the CV up via the SAME `getPublicCvForPage` path the
 * page route uses and 404s when it isn't published (fail closed — never renders
 * an unpublished CV's name). All display branching lives in the tested
 * `ogImageProps` helper; this handler is intentionally thin JSX.
 *
 * Only default/system fonts are used — no remote font fetch — so the card stays
 * self-contained and fast. The robots posture mirrors the page route: the owner
 * opts into indexing per-CV; otherwise the image stays noindex.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const record = await getPublicCvForPage(slug);
  if (!record) {
    return new Response("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { cv, indexable } = record;
  const { name, headline, affiliation, accentColor } = ogImageProps(cv);

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar across the top. */}
        <div style={{ display: "flex", width: "100%", height: 14, background: accentColor }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          {headline ? (
            <div style={{ fontSize: 36, marginTop: 24, color: "#334155" }}>{headline}</div>
          ) : null}
          {affiliation ? (
            <div style={{ fontSize: 30, marginTop: 14, color: "#64748b" }}>{affiliation}</div>
          ) : null}
        </div>

        {/* SigmaCV wordmark. */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 700, color: accentColor }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              marginRight: 16,
              borderRadius: 12,
              background: accentColor,
              color: "#ffffff",
              fontSize: 32,
            }}
          >
            Σ
          </span>
          SigmaCV
        </div>
      </div>
    ),
    SIZE,
  );

  // ImageResponse is a Response; copy its body but set our own cache/robots headers.
  return new Response(image.body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
