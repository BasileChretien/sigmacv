import { enforcePubPageRateLimit, tooManyRequests } from "@/app/p/[slug]/pubRateLimit";
import { countListedCvs } from "@/lib/cv/listed";
import {
  isKnownInstitutionMiss,
  isRorId,
  rememberInstitutionMiss,
} from "@/lib/institutions/institutions";
import { reconciliationExport, type ReconciliationExport } from "@/lib/institutions/reconciliation";

/**
 * Shared by the two reconciliation-export route handlers
 * (`/i/[ror]/reconciliation.csv` and `.json`). The order is the institution
 * page's (`institutionLoad.ts`): rate limit → id shape → negative cache →
 * database. A ROR nobody is listed under has no page and therefore no export
 * (404, remembered briefly); one with a page but no opted-in researcher gets
 * an EMPTY export, not a 404 — the difference between "no such institution
 * here" and "nobody shares rows". The routes take nothing beyond the ROR id
 * (the plan's "Institution input" veto): no filter, no format option, no
 * parameter of any kind.
 */
export type ReconciliationLookup =
  | { kind: "ok"; export: ReconciliationExport }
  | { kind: "missing" }
  | { kind: "rate-limited"; retryAfterSec: number };

export async function loadReconciliationExport(
  req: Request,
  ror: string,
): Promise<ReconciliationLookup> {
  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return { kind: "rate-limited", retryAfterSec: rl.retryAfterSec };
  if (!isRorId(ror) || isKnownInstitutionMiss(ror)) return { kind: "missing" };
  if ((await countListedCvs(ror)) < 1) {
    rememberInstitutionMiss(ror);
    return { kind: "missing" };
  }
  return { kind: "ok", export: await reconciliationExport(ror) };
}

/** The headers every reconciliation response carries: a download that is
 *  never indexed and never cached (the rows disappear with the next request
 *  after a withdrawal), served inert. `ror` is a validated bare id, so the
 *  filename can carry it. */
export function reconciliationHeaders(ror: string, format: "csv" | "json"): HeadersInit {
  return {
    "Content-Type":
      format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="sigmacv-reconciliation-${ror}.${format}"`,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'",
  };
}

/** The non-export outcomes as responses; null for a hit. */
export function reconciliationMiss(lookup: ReconciliationLookup): Response | null {
  if (lookup.kind === "rate-limited") return tooManyRequests(lookup.retryAfterSec);
  if (lookup.kind === "missing") {
    return new Response("No reconciliation export exists for this identifier.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
  return null;
}
