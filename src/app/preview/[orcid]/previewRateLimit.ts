import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/rateLimitStore";

/**
 * Rate limit for the no-login ORCID preview page. Building a preview fetches ~20
 * upstream sources and runs a CPU-heavy citeproc render — far heavier than
 * serving a cached public page — so the per-IP budget is tighter (per hour, not
 * per minute). A second GLOBAL ceiling bounds a distributed flood that rotates
 * source IPs. The per-ORCID cache + single-flight (orcidPreviewCache) blunt
 * repeat/concurrent hits on top of this.
 */
export const PREVIEW_MAX = 30;
export const PREVIEW_WINDOW_MS = 60 * 60_000; // 1 hour
export const PREVIEW_GLOBAL_MAX = 600;
export const PREVIEW_GLOBAL_WINDOW_MS = 60 * 60_000;

/**
 * Real client IP from the proxy headers. Caddy OVERWRITES X-Forwarded-For with
 * the real peer, so the trusted value is the RIGHTMOST hop — never the leftmost
 * client-supplied one (which an attacker could rotate to evade the per-IP limit).
 */
function clientIp(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export type PreviewRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

/** Apply the per-IP then global preview limit for the current request. */
export async function enforcePreviewRateLimit(): Promise<PreviewRateOutcome> {
  const h = await headers();
  const ip = clientIp(h);
  const rl = await enforceRateLimit(`preview:${ip}`, PREVIEW_MAX, PREVIEW_WINDOW_MS);
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const grl = await enforceRateLimit(
    "preview:global",
    PREVIEW_GLOBAL_MAX,
    PREVIEW_GLOBAL_WINDOW_MS,
  );
  if (!grl.ok) return { ok: false, retryAfterSec: grl.retryAfterSec };
  return { ok: true };
}
