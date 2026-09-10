import { chargeComparisonLimits } from "@/app/i/compareLimits";
import { institutionComparison } from "@/lib/institutions/compare";
import { CC0_URL, comparisonExport } from "@/lib/institutions/compareExport";
import { clientIp } from "@/lib/security/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `/i/compare.json?ror=a&ror=b[&ror=c]` — the comparison as counts-only data
 * (`compareExport.ts`), under CC0 with a citation request. Database only, the
 * same ids, the same rules and the same rate limit as the page; fewer than two
 * organisations to set side by side is a 404 that says which ids were left
 * out and why, exactly as the page does. Never indexed, never cached, and
 * readable cross-origin: it is public data meant to be reused.
 */
export async function GET(req: Request): Promise<Response> {
  const raw = new URL(req.url).searchParams.getAll("ror");
  const limited = await chargeComparisonLimits(clientIp(req), raw);
  if (!limited.ok) {
    return json({ error: "rate-limited", retryAfterSec: limited.retryAfterSec }, 429, {
      "Retry-After": String(limited.retryAfterSec),
    });
  }
  const comparison = await institutionComparison(raw);
  if (comparison.columns.length < 2) {
    return json({ error: "nothing-to-set-side-by-side", dropped: comparison.dropped }, 404);
  }
  return json(comparisonExport(comparison, new Date()), 200, {
    Link: `<${CC0_URL}>; rel="license"`,
  });
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Link, Retry-After",
      ...extra,
    },
  });
}
