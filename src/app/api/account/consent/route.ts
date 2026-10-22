import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";
import { isResearchLoggingEnabled } from "@/lib/research/enabled";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/log";
import {
  CONSENT_REQUEST_SHAPE,
  ConsentRequestSchema,
  type ConsentRequest,
} from "@/lib/research/consent/request";
import { consentStatus } from "@/lib/research/consent/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The body is a handful of fields; reject anything larger early (streamed).
const MAX_BODY_BYTES = 2_000;
// Consent is a rare, deliberate action; a tight cap stops the withdrawal branch
// (a transactional deleteMany) from being used as a write amplifier.
const CONSENT_MAX = 20;
const CONSENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
// Reading the status happens each time the research panel opens.
const STATUS_MAX = 120;

const RECORD_SELECT = {
  action: true,
  at: true,
  version: true,
  locale: true,
  agreeRequired: true,
  secondaryUse: true,
} as const;

/** The signed-in user's research participation, for the research panel. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const rl = await enforceRateLimit(`consent:read:${userId}`, STATUS_MAX, CONSENT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const [user, latestGrant, recordCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { researchConsent: true, researchConsentAt: true, researchConsentVersion: true },
    }),
    prisma.researchConsentRecord.findFirst({
      where: { userId, action: "grant" },
      orderBy: { at: "desc" },
      select: RECORD_SELECT,
    }),
    prisma.researchConsentRecord.count({ where: { userId } }),
  ]);
  const status = consentStatus({
    open: isResearchLoggingEnabled(),
    user,
    latestGrant,
    recordCount,
  });
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Grant or withdraw consent to study 2026-0310 (the gate for ALL research
 * logging). Each act writes a ResearchConsentRecord in the same transaction as
 * the User fields, so the electronic record always matches the account.
 */
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
  const parsed = ConsentRequestSchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json({ error: CONSENT_REQUEST_SHAPE }, { status: 422 });
  }

  const body = parsed.data;
  return body.consent
    ? grant(session.user.id, body)
    : withdraw(session.user.id, body.locale ?? null);
}

async function grant(userId: string, body: Extract<ConsentRequest, { consent: true }>) {
  // The study takes participants only while the master switch is on; a
  // withdrawal, below, is always possible.
  if (!isResearchLoggingEnabled()) {
    return NextResponse.json(
      { error: "Research participation is closed.", code: "closed" },
      { status: 409 },
    );
  }
  // The text the person read belongs to another consent version (the page was
  // loaded before an update): nothing is recorded, they read the current one.
  if (body.version !== RESEARCH_CONSENT_VERSION) {
    return NextResponse.json(
      { error: "The consent text has changed. Please read it again.", code: "stale_version" },
      { status: 409 },
    );
  }
  const at = new Date();
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { researchConsent: true, researchConsentVersion: true },
    });
    // A consent under an older version (the notice shown before approval) does
    // not cover what was logged under it: those events go, rather than travel
    // on under the approved consent given now.
    if (user?.researchConsent && user.researchConsentVersion !== RESEARCH_CONSENT_VERSION) {
      await tx.researchEvent.deleteMany({ where: { userId } });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        researchConsent: true,
        researchConsentAt: at,
        researchConsentVersion: RESEARCH_CONSENT_VERSION,
      },
    });
    await tx.researchConsentRecord.create({
      data: {
        userId,
        action: "grant",
        at,
        version: RESEARCH_CONSENT_VERSION,
        locale: body.locale,
        agreeRequired: body.agreeRequired,
        secondaryUse: body.secondaryUse ?? false,
      },
    });
  });
  return NextResponse.json({ ok: true, consent: true });
}

/**
 * Withdrawal (GDPR Art. 7(3) / 17; 別添1 §5): stop future logging, erase
 * everything collected under the consent, and write the withdrawal record,
 * atomically. The record names the version withdrawn from. With no consent to
 * withdraw (a second tab confirming again, or never consented) nothing is
 * recorded and nothing changes but the sweep of research events.
 */
async function withdraw(userId: string, locale: string | null) {
  const withdrawn = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { researchConsent: true, researchConsentVersion: true },
    });
    await tx.researchEvent.deleteMany({ where: { userId } });
    if (!user?.researchConsent) return false;
    await tx.user.update({
      where: { id: userId },
      data: { researchConsent: false, researchConsentAt: null, researchConsentVersion: null },
    });
    await tx.researchConsentRecord.create({
      data: {
        userId,
        action: "withdraw",
        version: user.researchConsentVersion ?? RESEARCH_CONSENT_VERSION,
        locale,
        agreeRequired: null,
        secondaryUse: null,
      },
    });
    return true;
  });
  return NextResponse.json({ ok: true, consent: false, withdrawn });
}
