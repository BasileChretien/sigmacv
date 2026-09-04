import {
  getPublicSnapshot,
  isValidSnapshotToken,
  snapshotPublicPath,
} from "@/lib/cv/snapshotStore";
import { diffSnapshots } from "@/lib/cv/snapshots";
import { renderDiffHtml, renderDiffMarkdown } from "@/lib/render/diff";
import { absoluteUrl } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../../../pubRateLimit";
import { publicNoticeResponse } from "../../../noticePage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(): Response {
  return publicNoticeResponse(
    404,
    "This comparison isn't available",
    "The link may be mistyped, or the owner may have made this frozen version private or unpublished their page.",
  );
}

/** Markdown when asked for explicitly (`?format=markdown`) or via `Accept`. */
function wantsMarkdown(req: Request): boolean {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "markdown") return true;
  const accept = (req.headers.get("accept") ?? "").toLowerCase();
  return accept.includes("text/markdown") && !accept.includes("text/html");
}

/**
 * PUBLIC "what changed since this frozen version": the diff between a public
 * snapshot and the CURRENT living CV. Public only when both sides are — the
 * snapshot is `isPublic` AND the parent page is published (that is exactly
 * `getPublicSnapshot`'s gate). Both sides are public-projected first, so hidden
 * items and un-opted metrics are absent on both sides and never surface here.
 * Names of changed display/profile KEYS only — never their values.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
): Promise<Response> {
  const { slug, token } = await params;

  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  if (!isValidPublicSlug(slug) || !isValidSnapshotToken(token)) return notFound();

  const snap = await getPublicSnapshot(slug, token);
  if (!snap) return notFound();

  const diff = diffSnapshots(snap.cv, snap.live);
  const locale = snap.cv.display.locale;
  const ctx = {
    version: snap.version,
    frozenAt: snap.createdAt,
    ownerName: snap.cv.owner.displayName,
    frozenHref: absoluteUrl(snapshotPublicPath(slug, token)),
    liveHref: absoluteUrl(`p/${slug}`),
  };
  const markdown = wantsMarkdown(req);
  const body = markdown ? renderDiffMarkdown(diff, locale, ctx) : renderDiffHtml(diff, locale, ctx);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": markdown ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
    },
  });
}
