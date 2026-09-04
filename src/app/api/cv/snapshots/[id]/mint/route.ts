import { NextResponse } from "next/server";
import { CvNotFoundError } from "@/lib/cv/sync";
import { mintDoiForSnapshot } from "@/lib/cv/snapshotStore";
import { doiMintingEnabled } from "@/lib/datacite/mint";
import { logger } from "@/lib/log";
import { guardSnapshotRequest } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Whether this server can mint DOIs at all (the editor disables the button on false). */
export async function GET(req: Request) {
  const g = await guardSnapshotRequest(req, { mutating: false, bucket: "snapshot-list", max: 600 });
  if (!g.ok) return g.res;
  return NextResponse.json({ doiMintingEnabled: doiMintingEnabled() });
}

/**
 * Mint a DataCite DOI for a public frozen version. FLAG-GATED: without the
 * DATACITE_* credentials this answers 409 `doi-minting-disabled` and makes no
 * network call. Preconditions (409): the version is public and the live page
 * is published, so the DOI has a landing page. A failed mint is 502 with the
 * version left in `doiState: "failed"` (retryable).
 */
export async function POST(req: Request, { params }: Params) {
  if (!doiMintingEnabled()) {
    return NextResponse.json({ error: "doi-minting-disabled" }, { status: 409 });
  }
  const g = await guardSnapshotRequest(req, { mutating: true, bucket: "snapshot-mint", max: 10 });
  if (!g.ok) return g.res;
  const { id } = await params;
  try {
    const outcome = await mintDoiForSnapshot(g.userId, id);
    switch (outcome.state) {
      case "minted":
      case "already-minted":
        return NextResponse.json({ doi: outcome.doi, doiState: "minted" });
      case "not-found":
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      case "not-public":
      case "not-published":
        return NextResponse.json({ error: outcome.state }, { status: 409 });
      case "disabled":
        return NextResponse.json({ error: "doi-minting-disabled" }, { status: 409 });
      case "failed":
        return NextResponse.json({ error: "mint-failed", doiState: "failed" }, { status: 502 });
    }
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.snapshot_mint_failed", { err });
    return NextResponse.json({ error: "Failed to mint a DOI" }, { status: 500 });
  }
}
