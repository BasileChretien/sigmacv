import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimitStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GDPR/APPI data export: everything we hold about the signed-in user. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = await enforceRateLimit(`export:account:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many export requests. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // Bound the in-memory export of the research log, but report the true total so
  // a GDPR/APPI export is never SILENTLY incomplete (the cap is far above any
  // realistic consent history; if it's ever hit the payload says so).
  const RESEARCH_EVENT_CAP = 50_000;
  const [user, accounts, sessions, cv, researchEvents, researchEventsTotal] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        orcid: true,
        researchConsent: true,
        digestOptIn: true,
        contactEmail: true,
        contactEmailVerifiedAt: true,
        createdAt: true,
      },
    }),
    // OAuth provider linkages — non-secret fields only (omit tokens).
    prisma.account.findMany({
      where: { userId },
      select: { provider: true, providerAccountId: true, type: true },
    }),
    // Session metadata (no token values).
    prisma.session.findMany({
      where: { userId },
      select: { expires: true },
    }),
    prisma.cv.findUnique({ where: { userId } }),
    prisma.researchEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RESEARCH_EVENT_CAP,
    }),
    prisma.researchEvent.count({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    accounts,
    sessions,
    cv: cv?.document ?? null,
    researchEvents,
    researchEventsTotal,
    // True only in the (unrealistic) event the cap was reached — tells the user
    // the export is partial rather than leaving them to assume it is complete.
    researchEventsTruncated: researchEventsTotal > researchEvents.length,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sigmacv-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
