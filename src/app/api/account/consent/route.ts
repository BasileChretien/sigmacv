import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ consent: z.boolean() });

/** Set the user's research-consent flag (the gate for ALL research logging). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
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
