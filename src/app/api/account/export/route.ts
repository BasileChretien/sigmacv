import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GDPR/APPI data export: everything we hold about the signed-in user. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, cv, researchEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        orcid: true,
        researchConsent: true,
        createdAt: true,
      },
    }),
    prisma.cv.findUnique({ where: { userId } }),
    prisma.researchEvent.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    cv: cv?.document ?? null,
    researchEvents,
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
