import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { MAX_TOTAL_CV_ITEMS, cvItemCount, getPublishState } from "@/lib/cv/sync";
import { absoluteUrl } from "@/lib/siteUrl";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";
import { renderCvHtml } from "@/lib/render/html";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preview runs a full citeproc render — throttle to blunt CPU abuse.
const PREVIEW_MAX = 240;
const PREVIEW_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BODY_BYTES = 8_000_000;

/** Render a (possibly unsaved) canonical document to HTML for live preview. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`preview:${session.user.id}`, PREVIEW_MAX, PREVIEW_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many preview requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "CV document too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CanonicalCvSchema.safeParse(
    (read.value as { document?: unknown } | null)?.document,
  );
  if (!parsed.success) {
    // Generic message — don't echo raw Zod issues (schema internals) to clients.
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }
  // The schema alone permits 60 × 10k items; cap the total before the (heavy,
  // synchronous) citeproc render so an unsaved bomb document can't pin the event
  // loop — the same ceiling the save path enforces.
  if (cvItemCount(parsed.data) > MAX_TOTAL_CV_ITEMS) {
    return NextResponse.json({ error: "CV has too many items" }, { status: 413 });
  }

  try {
    // `surface: "public"` previews the living public page (applies the chosen
    // animated publicStyle, or the document template when "match"); the default
    // previews the document render the exports use.
    const surface = (read.value as { surface?: unknown } | null)?.surface;
    let html: string;
    if (surface === "public") {
      html = renderPublicCvHtml(parsed.data);
    } else {
      // So the editor's document preview shows the opt-in QR exactly as the export
      // will: resolve the public-page URL only when the page is actually published.
      // Only the document surface needs it, so the publish-state DB read is skipped
      // on the (heavier) public-surface path.
      const ps = await getPublishState(session.user.id);
      const publicPageUrl =
        ps.published && ps.publicSlug ? absoluteUrl(`p/${ps.publicSlug}`) : undefined;
      html = renderCvHtml(parsed.data, { publicPageUrl });
    }
    return NextResponse.json({ html });
  } catch (err) {
    logger.error("api.cv_preview_failed", { err });
    return NextResponse.json({ error: "Failed to render preview" }, { status: 500 });
  }
}
