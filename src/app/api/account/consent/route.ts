import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ consent: z.boolean() });
// The body is a single boolean; reject anything larger early (streamed).
const MAX_BODY_BYTES = 2_000;
// Consent is a rare, deliberate action; a tight cap stops the withdrawal branch
// (a transactional deleteMany) from being used as a write amplifier.
const CONSENT_MAX = 20;
const CONSENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Set the user's research-consent flag (the gate for ALL research logging). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`consent:${session.user.id}`, CONSENT_MAX, CONSENT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "Request too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { consent: boolean }" }, { status: 422 });
  }

  const userId = session.user.id;
  if (parsed.data.consent) {
    // Grant: stamp WHEN and WHICH consent version (IRB audit trail).
    await prisma.user.update({
      where: { id: userId },
      data: {
        researchConsent: true,
        researchConsentAt: new Date(),
        researchConsentVersion: RESEARCH_CONSENT_VERSION,
      },
    });
  } else {
    // Withdrawal (GDPR Art. 7(3) / 17): stop future logging AND erase everything
    // collected under the prior consent, atomically.
    await prisma.$transaction([
      prisma.researchEvent.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          researchConsent: false,
          researchConsentAt: null,
          researchConsentVersion: null,
        },
      }),
    ]);
  }
  return NextResponse.json({ ok: true, consent: parsed.data.consent });
}
