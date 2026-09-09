import { reconciliationCsv } from "@/lib/institutions/reconciliationRows";
import {
  loadReconciliationExport,
  reconciliationHeaders,
  reconciliationMiss,
} from "../reconciliationRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `/i/<ror>/reconciliation.csv` — the per-work rows of every researcher who
 * opted in a second time under this institution, from their designated
 * frozen version, as an RFC 4180 CSV (header first, every field quoted, CRLF
 * records, no BOM). Database only; no aggregate, no ratio, no parameter.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ror: string }> },
): Promise<Response> {
  const { ror } = await params;
  const lookup = await loadReconciliationExport(req, ror);
  const miss = reconciliationMiss(lookup);
  if (miss || lookup.kind !== "ok") return miss!;
  return new Response(reconciliationCsv(lookup.export.rows), {
    status: 200,
    headers: reconciliationHeaders(ror, "csv"),
  });
}
