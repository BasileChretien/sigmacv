import {
  loadReconciliationExport,
  reconciliationHeaders,
  reconciliationMiss,
} from "../reconciliationRoute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `/i/<ror>/reconciliation.json` — the same rows as the CSV, in the envelope
 * `{ ror, generatedAt, rowCount, contributorCount, truncated, rows }`.
 * Database only; no aggregate, no ratio, no parameter.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ ror: string }> },
): Promise<Response> {
  const { ror } = await params;
  const lookup = await loadReconciliationExport(req, ror);
  const miss = reconciliationMiss(lookup);
  if (miss || lookup.kind !== "ok") return miss!;
  return new Response(JSON.stringify(lookup.export), {
    status: 200,
    headers: reconciliationHeaders(ror, "json"),
  });
}
