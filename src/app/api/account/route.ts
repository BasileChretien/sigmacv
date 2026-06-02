import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full account deletion. Cascades to accounts, sessions, CV, and research
 *  events (see schema onDelete: Cascade). Irreversible. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/account DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
