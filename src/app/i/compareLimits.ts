import { enforceInstitutionRateLimitForIp } from "@/app/i/institutionRateLimit";
import type { PubRateLimitOutcome } from "@/app/p/[slug]/pubRateLimit";
import { normaliseCompareIds } from "@/lib/institutions/compare";
import { enforceRateLimit } from "@/lib/rateLimitStore";

/**
 * The comparison surfaces' rate limit, shared by the page loader
 * (`institutionLoad.ts`) and the JSON export route: the view's own bucket per
 * IP first (one write pair), then the institution pages' limit
 * (`institutionRateLimit.ts`, never the public CV pages') charged once per
 * accepted organisation (at least once) — a hit that carries up to three
 * organisations' records must not hand one IP three times the data per
 * token. 2N + 1 write pairs per hit against the institution page's one,
 * accepted at the ceiling below.
 */
const COMPARE_MAX_PER_MIN = 20;

export async function chargeComparisonLimits(
  ip: string,
  raw: string | string[] | undefined,
): Promise<PubRateLimitOutcome> {
  const own = await enforceRateLimit(`icompare:${ip}`, COMPARE_MAX_PER_MIN, 60_000);
  if (!own.ok) return { ok: false, retryAfterSec: own.retryAfterSec };
  const charges = Math.max(1, normaliseCompareIds(raw).ids.length);
  for (let i = 0; i < charges; i++) {
    const rl = await enforceInstitutionRateLimitForIp(ip);
    if (!rl.ok) return rl;
  }
  return { ok: true };
}
