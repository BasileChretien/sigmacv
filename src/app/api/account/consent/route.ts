import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

  await prisma.user.update({
    where: { id: session.user.id },
    data: { researchConsent: parsed.data.consent },
  });
  return NextResponse.json({ ok: true, consent: parsed.data.consent });
}
