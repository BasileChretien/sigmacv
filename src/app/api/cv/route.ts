import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { CvNotFoundError, getCvForUser, saveCvForUser } from "@/lib/cv/sync";
import { validateStyleXml } from "@/lib/citeproc/engine";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A canonical document (embedded photo up to ~1.4 MB + bounded items) tops out
// at a few MB; reject anything much larger before we spend CPU parsing it.
const MAX_BODY_BYTES = 8_000_000;
// CV saves run full Zod validation + a JSON-column write — throttle per user so
// one account can't hammer the DB with large writes.
const SAVE_MAX = 120;
const SAVE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Load the signed-in user's canonical CV. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cv = await getCvForUser(session.user.id);
  return NextResponse.json({ cv });
}

/** Save the curated canonical CV (display curation — writes nowhere external). */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`save:${session.user.id}`, SAVE_MAX, SAVE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many save requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "CV document too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const document = (body as { document?: unknown } | null)?.document;
  const parsed = CanonicalCvSchema.safeParse(document);
  if (!parsed.success) {
    // Generic message — do NOT echo raw Zod issues (internal schema paths +
    // received values) back to the client.
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }

  // A custom CSL style is only structurally bounded by Zod (size/shape). Validate
  // it as real CSL at save time so an invalid/garbage style is rejected here
  // rather than failing at render on the public page.
  const customStyle = parsed.data.display.customStyle;
  if (customStyle) {
    const verdict = validateStyleXml(customStyle.xml);
    if (!verdict.ok) {
      return NextResponse.json({ error: "Invalid custom citation style" }, { status: 422 });
    }
  }

  try {
    const cv = await saveCvForUser(session.user.id, parsed.data);
    return NextResponse.json({ cv });
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.cv_patch_failed", { err });
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}
