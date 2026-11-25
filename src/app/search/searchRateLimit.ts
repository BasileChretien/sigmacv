import { headers } from "next/headers";
import { getRateLimit } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { clientIpFromHeaders } from "@/lib/security/clientIp";

/**
 * The lookup's own budget — never the preview's. Every distinct query is one
 * call against the OpenAlex polite pool that every user's sync shares, so the
 * global ceilings are what protect the service; the per-IP one is what a
 * person notices.
 *
 * By default 20 per IP a minute, and 300 a minute and 3,000 an hour site-wide;
 * an event whose audience shares one IP raises them for the day with
 * `SEARCH_MAX_PER_IP`, `SEARCH_MAX_GLOBAL_PER_MINUTE` and
 * `SEARCH_MAX_GLOBAL_PER_HOUR` (`getRateLimit` in `src/lib/env.ts`). All three are
 * read before any bucket is spent, so a refused value spends nothing.
 */
const SEARCH_IP_WINDOW_MS = 60_000;
const SEARCH_GLOBAL_MINUTE_WINDOW_MS = 60_000;
const SEARCH_GLOBAL_HOUR_WINDOW_MS = 60 * 60_000;

export type SearchRateOutcome = { ok: true } | { ok: false; retryAfterSec: number };

/** Apply the per-IP, per-minute global and per-hour global search limits. */
export async function enforceSearchRateLimit(): Promise<SearchRateOutcome> {
  const perIp = getRateLimit("SEARCH_MAX_PER_IP");
  const perMinute = getRateLimit("SEARCH_MAX_GLOBAL_PER_MINUTE");
  const perHour = getRateLimit("SEARCH_MAX_GLOBAL_PER_HOUR");
  const ip = clientIpFromHeaders(await headers());
  const rl = await enforceRateLimit(`search:${ip}`, perIp, SEARCH_IP_WINDOW_MS);
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const gm = await enforceRateLimit(
    "search:global:minute",
    perMinute,
    SEARCH_GLOBAL_MINUTE_WINDOW_MS,
  );
  if (!gm.ok) return { ok: false, retryAfterSec: gm.retryAfterSec };
  const gh = await enforceRateLimit("search:global:hour", perHour, SEARCH_GLOBAL_HOUR_WINDOW_MS);
  if (!gh.ok) return { ok: false, retryAfterSec: gh.retryAfterSec };
  return { ok: true };
}
