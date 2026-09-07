import { NextResponse } from "next/server";
import { z } from "zod";
import { CvNotFoundError } from "@/lib/cv/sync";
import { SNAPSHOT_LABEL_MAX } from "@/lib/cv/snapshots";
import { deleteSnapshot, SnapshotDoiLockedError, updateSnapshot } from "@/lib/cv/snapshotStore";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { guardSnapshotRequest } from "../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z
  .object({
    isPublic: z.boolean().optional(),
    label: z.string().trim().min(1).max(SNAPSHOT_LABEL_MAX).optional(),
  })
  .refine((v) => v.isPublic !== undefined || v.label !== undefined, {
    message: "Nothing to update",
  });
const MAX_BODY_BYTES = 2_000;

type Params = { params: Promise<{ id: string }> };

/** Relabel / toggle the public link of one frozen version. */
export async function PATCH(req: Request, { params }: Params) {
  const g = await guardSnapshotRequest(req, {
    mutating: true,
    bucket: "snapshot-mutate",
    max: 120,
  });
  if (!g.ok) return g.res;
  const { id } = await params;

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "Request too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected { isPublic?: boolean, label?: string }" },
      { status: 422 },
    );
  }

  try {
    const snapshot = await updateSnapshot(g.userId, id, parsed.data);
    if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ snapshot });
  } catch (err) {
    if (err instanceof SnapshotDoiLockedError) {
      return NextResponse.json({ error: "doi-minted" }, { status: 409 });
    }
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshot_update_failed", { err });
    return NextResponse.json({ error: "Failed to update the version" }, { status: 500 });
  }
}

/** Delete one frozen version (irreversible; the owner's explicit choice). */
export async function DELETE(req: Request, { params }: Params) {
  const g = await guardSnapshotRequest(req, {
    mutating: true,
    bucket: "snapshot-mutate",
    max: 120,
  });
  if (!g.ok) return g.res;
  const { id } = await params;
  try {
    const removed = await deleteSnapshot(g.userId, id);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshot_delete_failed", { err });
    return NextResponse.json({ error: "Failed to delete the version" }, { status: 500 });
  }
}
