import { NextResponse } from "next/server";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { MAX_TOTAL_CV_ITEMS, cvItemCount } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { renderCvHtml } from "@/lib/render/html";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import { previewCaller } from "@/app/api/cv/previewGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The ANONYMOUS twin of /api/cv/preview: it re-renders the working document for
// the no-login interactive preview editor as the visitor curates/restyles. No
// session and no DB — it only renders a client-supplied document, so there's
// nothing to leak; it's same-origin-only and rate-limited per IP (a citeproc
// render is CPU-heavy), with a second global ceiling and the same item cap.
const RENDER_MAX = 240;
const RENDER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RENDER_GLOBAL_MAX = 6_000;
const RENDER_GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 8_000_000;

/** Render a (possibly-edited) canonical document to HTML for the anonymous
 *  interactive preview. Mirrors /api/cv/preview but keyed by IP, not a session. */
export async function POST(req: Request) {
  // Reuse the same same-origin + IP gate as the sibling gallery/styles preview
  // routes (anon-only here, but shared so the three stay consistent).
  const gate = await previewCaller(req);
  if (!gate.ok) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`preview-render:${gate.key}`, RENDER_MAX, RENDER_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many preview updates. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const grl = await enforceRateLimit(
    "preview-render:global",
    RENDER_GLOBAL_MAX,
    RENDER_GLOBAL_WINDOW_MS,
  );
  if (!grl.ok) {
    return NextResponse.json(
      { error: "The preview is busy. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(grl.retryAfterSec) } },
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
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }
  // Cap total items before the (heavy, synchronous) citeproc render so an edited
  // bomb document can't pin the event loop — the same ceiling the save path uses.
  if (cvItemCount(parsed.data) > MAX_TOTAL_CV_ITEMS) {
    return NextResponse.json({ error: "CV has too many items" }, { status: 413 });
  }

  try {
    const surface = (read.value as { surface?: unknown } | null)?.surface;
    const html = surface === "public" ? renderPublicCvHtml(parsed.data) : renderCvHtml(parsed.data);
    return NextResponse.json({ html });
  } catch (err) {
    logger.error("api.preview_render_failed", { err });
    return NextResponse.json({ error: "Failed to render preview" }, { status: 500 });
  }
}
