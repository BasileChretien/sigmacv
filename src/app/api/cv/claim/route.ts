import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { addClaimByDoi, previewClaim } from "@/lib/cv/claim";
import { CvNotFoundError } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One OpenAlex fetch per call — lighter than a full sync, but still rate-limited.
const CLAIM_MAX = 40;
const CLAIM_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const BodySchema = z.object({
  doi: z.string().trim().min(1).max(400),
  /** Absent → preview (no mutation); true → build + add + save. */
  confirm: z.boolean().optional(),
  /** Which author the user is, when there's no identifier match (0-based). */
  selfAuthorIndex: z.number().int().min(0).max(2000).optional(),
});

/**
 * Add a work by DOI. POST { doi } previews it (resolved title/authors + dedup);
 * POST { doi, confirm:true, selfAuthorIndex? } builds it from OpenAlex, appends
 * it, saves, and returns the updated CV.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  if (!session.user.orcid) {
    return NextResponse.json(
      { error: "No ORCID iD associated with this account." },
      { status: 400 },
    );
  }

  const rl = await enforceRateLimit(`claim:${session.user.id}`, CLAIM_MAX, CLAIM_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    // Generic message — don't echo raw Zod issues (internal schema paths).
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { doi, confirm, selfAuthorIndex } = parsed.data;
  try {
    if (!confirm) {
      return NextResponse.json(
        await previewClaim(session.user.id, session.user.orcid, doi),
      );
    }
    return NextResponse.json(
      await addClaimByDoi(session.user.id, session.user.orcid, doi, selfAuthorIndex),
    );
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.cv_claim_failed", { err });
    return NextResponse.json(
      { error: "Failed to look up the DOI. Please try again." },
      { status: 502 },
    );
  }
}
