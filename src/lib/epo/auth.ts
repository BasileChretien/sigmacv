import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";

/**
 * EPO Open Patent Services (OPS) authentication — OAuth2 Client Credentials.
 *
 * OPS has NO anonymous access. We exchange the consumer key + secret (env
 * `EPO_OPS_KEY` / `EPO_OPS_SECRET`) for a short-lived (~20 min) access token via
 * HTTP Basic auth, cache it in-process until shortly before expiry, and send it
 * as `Authorization: Bearer …` on data requests.
 *
 * Optional + fail-soft: with neither credential configured (or on any exchange
 * failure) this returns null and the patents client makes no request.
 */

const TOKEN_ENDPOINT = "https://ops.epo.org/3.2/auth/accesstoken";

/** Renew this many ms before the token actually expires (clock-skew margin). */
const EXPIRY_MARGIN_MS = 60_000;
/** OPS tokens last ~20 min; fall back to this when expires_in is missing. */
const DEFAULT_TTL_MS = 1_200_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

/**
 * A valid OPS access token, or null when no credentials are configured / the
 * exchange fails. `now` is injectable for deterministic tests.
 */
export async function getEpoAccessToken(now: number = Date.now()): Promise<string | null> {
  const { EPO_OPS_KEY, EPO_OPS_SECRET } = getEnv();
  if (!EPO_OPS_KEY || !EPO_OPS_SECRET) return null;
  if (cached && cached.expiresAt > now + EXPIRY_MARGIN_MS) return cached.token;

  try {
    const basic = Buffer.from(`${EPO_OPS_KEY}:${EPO_OPS_SECRET}`).toString("base64");
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      logger.warn("epo.token_exchange_failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
    const token =
      typeof data.access_token === "string" && data.access_token.length > 0
        ? data.access_token
        : null;
    if (!token) {
      logger.warn("epo.token_exchange_no_token", {});
      return null;
    }
    // OPS returns expires_in as a STRING (e.g. "1199"); coerce defensively.
    const ttlSec = Number(data.expires_in);
    const ttlMs = Number.isFinite(ttlSec) && ttlSec > 0 ? ttlSec * 1000 : DEFAULT_TTL_MS;
    cached = { token, expiresAt: now + ttlMs };
    return token;
  } catch (err) {
    logger.warn("epo.token_exchange_error", { err });
    return null;
  }
}

/** Clear the in-process token cache. Test seam only. */
export function resetEpoTokenCache(): void {
  cached = null;
}
