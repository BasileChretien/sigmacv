import { NextResponse } from "next/server";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { previewCaller } from "@/app/api/cv/previewGate";
import { templateGalleryPreviews } from "@/lib/render/galleryPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One request renders the sample in EVERY template (~5x a single preview), so a
// tighter cap (the gallery fetches once per editor session) + a body ceiling.
const GALLERY_MAX = 30;
const GALLERY_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BODY_BYTES = 8_000_000;

/** Render a trimmed sample of the document in every template, for the editor's
 *  template-picker thumbnails (real previews, not schematics). */
export async function POST(req: Request) {
  // Signed-in OR anonymous (the no-login interactive preview): pure client-doc
  // render, so no account required. Same-origin enforced; anon keyed by IP.
  const gate = await previewCaller(req);
  if (!gate.ok) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`preview-gallery:${gate.key}`, GALLERY_MAX, GALLERY_WINDOW_MS);
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
    // Generic message — don't echo raw Zod issues (internal schema paths).
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }

  try {
    const previews = templateGalleryPreviews(parsed.data);
    return NextResponse.json({ previews });
  } catch (err) {
    logger.error("api.cv_preview_gallery_failed", { err });
    return NextResponse.json({ error: "Failed to render template previews" }, { status: 500 });
  }
}
