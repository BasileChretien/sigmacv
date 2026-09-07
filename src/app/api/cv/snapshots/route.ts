import { NextResponse } from "next/server";
import { z } from "zod";
import { CvNotFoundError } from "@/lib/cv/sync";
import { isCvModelId } from "@/lib/canonical/cvModels";
import { FREEZE_PRESETS } from "@/lib/cv/freezeRequest";
import { SNAPSHOT_LABEL_MAX } from "@/lib/cv/snapshots";
import { createSnapshot, listSnapshots, SnapshotLimitError } from "@/lib/cv/snapshotStore";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { guardSnapshotRequest } from "./guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  label: z.string().trim().min(1).max(SNAPSHOT_LABEL_MAX),
  /** Freeze-time display preset (reader view / hiring panel) — an explicit,
   *  one-time owner choice. Absent = the standard page. */
  preset: z.enum(FREEZE_PRESETS).optional(),
  /** Freeze in the shape of this CV model (catalog id); the live CV is untouched. */
  modelId: z.string().max(64).refine(isCvModelId, "unknown model").optional(),
});
// The body is one short label; reject anything larger early (streamed).
const MAX_BODY_BYTES = 2_000;

/** List the owner's frozen versions (+ publish state and whether DOIs can be minted). */
export async function GET(req: Request) {
  const g = await guardSnapshotRequest(req, { mutating: false, bucket: "snapshot-list", max: 600 });
  if (!g.ok) return g.res;
  try {
    return NextResponse.json(await listSnapshots(g.userId));
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshots_list_failed", { err });
    return NextResponse.json({ error: "Failed to list versions" }, { status: 500 });
  }
}

/** Freeze the current CV as the next version. */
export async function POST(req: Request) {
  const g = await guardSnapshotRequest(req, { mutating: true, bucket: "snapshot-create", max: 30 });
  if (!g.ok) return g.res;

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "Request too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Expected { label: string (1–${SNAPSHOT_LABEL_MAX} chars), preset?: "reader" | "hiring", modelId?: string }`,
      },
      { status: 422 },
    );
  }

  try {
    const snapshot = await createSnapshot(g.userId, parsed.data.label, {
      ...(parsed.data.preset ? { preset: parsed.data.preset } : {}),
      ...(parsed.data.modelId ? { modelId: parsed.data.modelId } : {}),
    });
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (err) {
    if (err instanceof SnapshotLimitError) {
      return NextResponse.json({ error: "snapshot-limit" }, { status: 409 });
    }
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshot_create_failed", { err });
    return NextResponse.json({ error: "Failed to freeze the version" }, { status: 500 });
  }
}
