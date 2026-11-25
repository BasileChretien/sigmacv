import { NextResponse } from "next/server";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { getCallerRateLimit } from "@/lib/env";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { previewCaller } from "@/app/api/cv/previewGate";
import { publicStyleGalleryPreviews } from "@/lib/render/galleryPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Renders the sample in every public-page style (~10× a single preview), so a
// tight cap. Fetched lazily — only when the "Public page style" group is opened.
// 30 an hour by default; an event whose audience shares one IP raises it for
// the day for visitors who are not signed in (PREVIEW_THUMBNAILS_MAX_PER_IP); a
// signed-in account keeps 30 (`getCallerRateLimit`).
const STYLES_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BODY_BYTES = 8_000_000;

/** Render a trimmed sample of the document in every public-page showcase style,
 *  for the editor's "Public page style" picker thumbnails. */
export async function POST(req: Request) {
  // Signed-in OR anonymous (the no-login interactive preview): pure client-doc
  // render, so no account required. Same-origin enforced; anon keyed by IP.
  const gate = await previewCaller(req);
  if (!gate.ok) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(
    `preview-styles:${gate.key}`,
    getCallerRateLimit("PREVIEW_THUMBNAILS_MAX_PER_IP", gate.signedIn),
    STYLES_WINDOW_MS,
  );
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
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }

  try {
    const stylePreviews = publicStyleGalleryPreviews(parsed.data);
    return NextResponse.json({ stylePreviews });
  } catch (err) {
    logger.error("api.cv_preview_styles_failed", { err });
    return NextResponse.json({ error: "Failed to render style previews" }, { status: 500 });
  }
}
