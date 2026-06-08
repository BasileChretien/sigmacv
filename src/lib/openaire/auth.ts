import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * OpenAIRE Graph API authentication.
 *
 * We hold a 1-month **refresh token** (env `OPENAIRE_REFRESH_TOKEN`) and exchange
 * it for a short-lived (~1h) **access token**, cached in-process until shortly
 * before expiry. The access token is sent as `Authorization: Bearer …` on Graph
 * API requests for higher rate limits.
 *
 * Optional + fail-soft: with no refresh token configured (or on any exchange
 * failure) this returns null and the client falls back to anonymous requests.
 */

const TOKEN_ENDPOINT = "https://services.openaire.eu/uoa-user-management/api/users/getAccessToken";

/** Renew this many ms before the token actually expires (clock-skew margin). */
const EXPIRY_MARGIN_MS = 60_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

/**
 * A valid OpenAIRE access token, or null when none is configured / obtainable.
 * `now` is injectable for deterministic tests.
 */
export async function getOpenaireAccessToken(now: number = Date.now()): Promise<string | null> {
  const refreshToken = getEnv().OPENAIRE_REFRESH_TOKEN;
  if (!refreshToken) return null;
  if (cached && cached.expiresAt > now + EXPIRY_MARGIN_MS) return cached.token;

  try {
    const url = new URL(TOKEN_ENDPOINT);
    url.searchParams.set("refreshToken", refreshToken);
    // Via the shared wrapper so a hung token server times out instead of
    // stalling the sync; retries:0 keeps the single-attempt semantics.
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json" },
      timeoutMs: 12_000,
      retries: 0,
    });
    if (!res.ok) {
      logger.warn("openaire.token_exchange_failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };
    const token =
      typeof data.access_token === "string" && data.access_token.length > 0
        ? data.access_token
        : null;
    if (!token) {
      logger.warn("openaire.token_exchange_no_token", {});
      return null;
    }
    const ttlSec = Number(data.expires_in);
    const ttlMs = Number.isFinite(ttlSec) && ttlSec > 0 ? ttlSec * 1000 : 3_600_000;
    cached = { token, expiresAt: now + ttlMs };
    return token;
  } catch (err) {
    logger.warn("openaire.token_exchange_error", { err });
    return null;
  }
}

/** Clear the in-process token cache. Test seam only. */
export function resetOpenaireTokenCache(): void {
  cached = null;
}
