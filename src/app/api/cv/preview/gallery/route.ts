import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { templateGalleryPreviews } from "@/lib/render/galleryPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One request renders the sample in every template — heavier than a single
// preview, so a tighter cap (the gallery fetches once per editor session).
const GALLERY_MAX = 60;
const GALLERY_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Render a trimmed sample of the document in every template, for the editor's
 *  template-picker thumbnails (real previews, not schematics). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await enforceRateLimit(
    `preview-gallery:${session.user.id}`,
    GALLERY_MAX,
    GALLERY_WINDOW_MS,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many preview requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CanonicalCvSchema.safeParse(
    (body as { document?: unknown } | null)?.document,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid CV document", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const previews = templateGalleryPreviews(parsed.data);
    return NextResponse.json({ previews });
  } catch (err) {
    logger.error("api.cv_preview_gallery_failed", { err });
    return NextResponse.json(
      { error: "Failed to render template previews" },
      { status: 500 },
    );
  }
}
