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
        emailVerified: true,
        image: true,
        orcid: true,
        // The research-consent audit trail: what was agreed, when, which version.
        researchConsent: true,
        researchConsentAt: true,
        researchConsentVersion: true,
        digestOptIn: true,
        digestSentAt: true,
        contactEmail: true,
        contactEmailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
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

  // Frozen CV versions (snapshots) are the user's data too: the frozen document
  // of each, its label/version/date, whether it is public, its capability token
  // and any minted DOI. Bounded by MAX_SNAPSHOTS_PER_CV, so no cap/truncation.
  const snapshots = cv
    ? await prisma.cvSnapshot.findMany({
        where: { cvId: cv.id },
        orderBy: { version: "asc" },
        select: {
          id: true,
          version: true,
          label: true,
          createdAt: true,
          token: true,
          isPublic: true,
          doi: true,
          doiState: true,
          canonical: true,
        },
      })
    : [];

  // The CV row beyond the document itself: whether the living page is published,
  // at which URL, whether it may be indexed, when it last synced and what that
  // sync changed. Internal job bookkeeping (the resync lock) is not user data.
  const cvRecord = cv
    ? {
        id: cv.id,
        schemaVersion: cv.schemaVersion,
        lastSyncedAt: cv.lastSyncedAt,
        lastSyncReport: cv.lastSyncReport,
        published: cv.published,
        publicSlug: cv.publicSlug,
        publicIndexable: cv.publicIndexable,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      }
    : null;

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    accounts,
    sessions,
    cv: cv?.document ?? null,
    cvRecord,
    snapshots,
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
