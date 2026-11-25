import { headers } from "next/headers";
import { getRateLimit } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { clientIpFromHeaders } from "@/lib/security/clientIp";

/**
 * Rate limit for the no-login ORCID preview page. Building a preview fetches ~20
 * upstream sources and runs a CPU-heavy citeproc render — far heavier than
 * serving a cached public page — so the per-IP budget is tighter (per hour, not
 * per minute). A second GLOBAL ceiling bounds a distributed flood that rotates
 * source IPs. The per-ORCID cache + single-flight (orcidPreviewCache) blunt
 * repeat/concurrent hits on top of this.
 *
 * The ceilings are 30 per IP and 600 site-wide by default; an event whose
 * audience shares one IP raises them for the day with `PREVIEW_MAX_PER_IP` and
 * `PREVIEW_MAX_GLOBAL` (`getRateLimit` in `src/lib/env.ts`). Both are read before
 * either bucket is spent, so a refused value spends nothing.
 */
const PREVIEW_WINDOW_MS = 60 * 60_000; // 1 hour
const PREVIEW_GLOBAL_WINDOW_MS = 60 * 60_000;

export type PreviewRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

/** Apply the per-IP then global preview limit for the current request. */
export async function enforcePreviewRateLimit(): Promise<PreviewRateOutcome> {
  const perIp = getRateLimit("PREVIEW_MAX_PER_IP");
  const global = getRateLimit("PREVIEW_MAX_GLOBAL");
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const rl = await enforceRateLimit(`preview:${ip}`, perIp, PREVIEW_WINDOW_MS);
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const grl = await enforceRateLimit("preview:global", global, PREVIEW_GLOBAL_WINDOW_MS);
  if (!grl.ok) return { ok: false, retryAfterSec: grl.retryAfterSec };
  return { ok: true };
}
