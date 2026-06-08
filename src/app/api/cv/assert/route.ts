import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { pendingNotMineAssertions } from "@/lib/canonical/assertions";
import { getCvForUser } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { isOpenAlexCurationEnabled, submitCurationAssertions } from "@/lib/openalex/assert";
import { recordCurationAudit } from "@/lib/openalex/curationAudit";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// An upstream curation push is a rare, high-trust action: cap hard per user.
const ASSERT_MAX = 5;
const ASSERT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
// The confirm body is tiny ({ "confirm": true }); reject anything larger early.
const MAX_BODY_BYTES = 2_000;
// Require an explicit `{ confirm: true }` opt-in (validated, per the route convention).
const AssertBodySchema = z.object({ confirm: z.literal(true) });

/**
 * POST /api/cv/assert — push the signed-in user's "not mine" corrections UPSTREAM
 * to OpenAlex (Phase 5). DEFERRED v2, gated OFF by default.
 *
 * Mirrors `internal/resync`: returns 503 when the feature flag is unset, so the
 * default deployment exposes NO external curation write. Requires explicit
 * in-body opt-in (`{ confirm: true }`). All real logic lives in tested
 * `src/lib/**` helpers — this route only wires auth, gating, consent + audit.
 */
export async function POST(req: Request) {
  // Feature gate FIRST: 503 + nothing else when disabled (default). No CV is
  // loaded and no network call is possible on this path.
  if (!isOpenAlexCurationEnabled()) {
    return NextResponse.json({ disabled: true }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  // Explicit per-request opt-in. Without `{ confirm: true }` we do nothing.
  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "Request too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!AssertBodySchema.safeParse(read.value).success) {
    return NextResponse.json(
      { error: "Explicit confirmation required.", confirm: false },
      { status: 400 },
    );
  }

  const rl = await enforceRateLimit(`assert:${session.user.id}`, ASSERT_MAX, ASSERT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many assertion requests. Please wait a while." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    const cv = await getCvForUser(session.user.id);
    if (!cv) {
      return NextResponse.json({ error: "No CV to assert from." }, { status: 404 });
    }

    const assertions = pendingNotMineAssertions(cv);
    const result = await submitCurationAssertions(assertions);
    recordCurationAudit(session.user.id, assertions.length, result);

    return NextResponse.json({
      status: result.status,
      assertionCount: assertions.length,
    });
  } catch (err) {
    logger.error("api.cv_assert_failed", { err });
    return NextResponse.json({ error: "Failed to submit assertions." }, { status: 500 });
  }
}
