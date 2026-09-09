import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { clientIpFromHeaders } from "@/lib/security/clientIp";

/**
 * The lookup's own budget — never the preview's. Every distinct query is one
 * call against the OpenAlex polite pool that every user's sync shares, so the
 * global ceilings are what protect the service; the per-IP one is what a
 * person notices.
 */
const SEARCH_IP_MAX = 20;
const SEARCH_IP_WINDOW_MS = 60_000;
const SEARCH_GLOBAL_MINUTE_MAX = 300;
const SEARCH_GLOBAL_HOUR_MAX = 3_000;

export type SearchRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

/** Apply the per-IP, per-minute global and per-hour global search limits. */
export async function enforceSearchRateLimit(): Promise<SearchRateOutcome> {
  const ip = clientIpFromHeaders(await headers());
  const rl = await enforceRateLimit(`search:${ip}`, SEARCH_IP_MAX, SEARCH_IP_WINDOW_MS);
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const gm = await enforceRateLimit("search:global:minute", SEARCH_GLOBAL_MINUTE_MAX, 60_000);
  if (!gm.ok) return { ok: false, retryAfterSec: gm.retryAfterSec };
  const gh = await enforceRateLimit("search:global:hour", SEARCH_GLOBAL_HOUR_MAX, 60 * 60_000);
  if (!gh.ok) return { ok: false, retryAfterSec: gh.retryAfterSec };
  return { ok: true };
}
