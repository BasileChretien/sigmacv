import { NextResponse } from "next/server";
import { CvNotFoundError } from "@/lib/cv/sync";
import { getOwnerSnapshot, snapshotPublicPath } from "@/lib/cv/snapshotStore";
import { diffSnapshots } from "@/lib/cv/snapshots";
import { asLocale } from "@/lib/i18n";
import { logger } from "@/lib/log";
import { renderDiffHtml, renderDiffMarkdown } from "@/lib/render/diff";
import { absoluteUrl } from "@/lib/siteUrl";
import { guardSnapshotRequest } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * The OWNER's "compare with live": the diff between one of their frozen
 * versions and their CURRENT document, at the owner level (hidden items and
 * all metrics included — it's their own data). HTML by default; `?format=markdown`
 * for the Markdown rendering. `?locale=` picks the UI language (falls back to
 * the CV's content locale). Never cached; owner-only.
 */
export async function GET(req: Request, { params }: Params) {
  const g = await guardSnapshotRequest(req, { mutating: false, bucket: "snapshot-list", max: 600 });
  if (!g.ok) return g.res;
  const { id } = await params;
  const url = new URL(req.url);
  const wantMarkdown = url.searchParams.get("format") === "markdown";

  try {
    const view = await getOwnerSnapshot(g.userId, id);
    if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const locale = asLocale(url.searchParams.get("locale") ?? view.live.display.locale);
    const diff = diffSnapshots(view.frozen, view.live);
    const ctx = {
      version: view.snapshot.version,
      frozenAt: view.snapshot.createdAt,
      ownerName: view.live.owner.displayName,
      // The frozen page + live page links exist only once the CV is published
      // and the version is public — otherwise the owner has no shareable URL.
      ...(view.publicSlug && view.snapshot.isPublic
        ? {
            frozenHref: absoluteUrl(snapshotPublicPath(view.publicSlug, view.snapshot.token)),
            liveHref: absoluteUrl(`p/${view.publicSlug}`),
          }
        : {}),
    };
    const body = wantMarkdown
      ? renderDiffMarkdown(diff, locale, ctx)
      : renderDiffHtml(diff, locale, ctx);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": wantMarkdown ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshot_diff_failed", { err });
    return NextResponse.json({ error: "Failed to compare versions" }, { status: 500 });
  }
}
