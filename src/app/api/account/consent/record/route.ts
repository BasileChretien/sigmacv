import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { consentRecordDocument } from "@/lib/research/consent/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bounded like the account export: a consent history is a few rows. */
const RECORD_CAP = 1_000;

/**
 * The participant's consent record for study 2026-0310 as a JSON download
 * (別添1 §5: the consent and withdrawal records can be shown and saved at any
 * time). The same rows are in the account data export.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const rl = await enforceRateLimit(`consent:record:${userId}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const records = await prisma.researchConsentRecord.findMany({
    where: { userId },
    orderBy: { at: "asc" },
    take: RECORD_CAP,
    select: { action: true, at: true, version: true, locale: true, secondaryUse: true },
  });
  const body = JSON.stringify(consentRecordDocument(records, new Date()), null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sigmacv-research-consent-record.json"',
      "Cache-Control": "no-store",
    },
  });
}
