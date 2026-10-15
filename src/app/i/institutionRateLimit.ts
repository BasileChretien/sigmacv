import type { PubRateLimitOutcome } from "@/app/p/[slug]/pubRateLimit";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { clientIp } from "@/lib/security/clientIp";

/**
 * The institution surfaces' own rate limit — `/i`, `/i/[ror]`, the
 * reconciliation export and the comparison view (`compareLimits.ts`) — per IP
 * and global, under `instpage:` keys of their own.
 *
 * They used to share the public CV pages' `pubpage:` buckets. ROR ids are a
 * public namespace anyone can enumerate (about 120,000 of them), so a scan of
 * `/i/<ror>` spread over enough addresses could spend the global ceiling the
 * researchers' own pages live under and make every `/p/<slug>` answer 429 (the
 * 2026-09-08 panel's defect 7). With ceilings of their own, a flood on one
 * surface cannot starve the other. The per-IP ceiling is the CV pages'; the
 * global one is lower, since an institution page is read far less often and
 * each read is four queries. A scan that spends it makes the institution
 * surfaces answer "too many requests" for a minute, and nothing else.
 */

/** Per IP per minute: the public CV pages' own figure, so an address that
 *  reads institution pages has the budget it had when the buckets were shared.
 *  Many readers can sit behind one address (a university network, a workshop
 *  room). The comparison view charges once per organisation (up to three) on
 *  top of its own 20/min bucket: at that bucket's full rate it spends 60, and
 *  the rest is left for the pages a reader opens from it. */
const INSTPAGE_MAX = 120;
const INSTPAGE_WINDOW_MS = 60_000;
/** Across all IPs per minute: bounds a scan that rotates source addresses. */
const INSTPAGE_GLOBAL_MAX = 1_000;
const INSTPAGE_GLOBAL_WINDOW_MS = 60_000;

/** Apply the per-IP then global institution limit for a client IP. */
export async function enforceInstitutionRateLimitForIp(ip: string): Promise<PubRateLimitOutcome> {
  const rl = await enforceRateLimit(`instpage:${ip}`, INSTPAGE_MAX, INSTPAGE_WINDOW_MS);
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const grl = await enforceRateLimit(
    "instpage:global",
    INSTPAGE_GLOBAL_MAX,
    INSTPAGE_GLOBAL_WINDOW_MS,
  );
  if (!grl.ok) return { ok: false, retryAfterSec: grl.retryAfterSec };
  return { ok: true };
}

/** The same limit for a route handler that has the `Request`. */
export async function enforceInstitutionRateLimit(req: Request): Promise<PubRateLimitOutcome> {
  return enforceInstitutionRateLimitForIp(clientIp(req));
}
