/**
 * Shared resilient fetch for outbound calls to external research APIs
 * (OpenAlex, ORCID, ROR, DataCite, Crossref, …).
 *
 * Every external call MUST have a timeout and bounded retry — a hung upstream
 * connection otherwise stalls a whole sync (and the cron resync) indefinitely.
 * Retries cover transient 429/5xx and network errors with exponential backoff,
 * honoring `Retry-After` when present.
 */

export interface ResilientFetchOptions {
  timeoutMs?: number;
  /** Number of RETRIES after the first attempt (so total attempts = retries+1). */
  retries?: number;
  headers?: Record<string, string>;
  /** Next.js fetch cache hint (server components / route handlers). */
  next?: { revalidate?: number };
  method?: "GET" | "POST";
  body?: BodyInit;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const MAX_BACKOFF_MS = 8_000;

function backoffMs(attempt: number): number {
  // 400ms, 800ms, 1600ms … capped.
  return Math.min(MAX_BACKOFF_MS, 400 * 2 ** attempt);
}

function retryAfterMs(res: Response): number | null {
  const ra = res.headers.get("retry-after");
  if (!ra) return null;
  const secs = Number(ra);
  return Number.isFinite(secs) ? secs * 1000 : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with a per-attempt timeout and bounded retry on transient failures.
 * Returns the final Response (callers handle status). Throws only on a network
 * error / timeout that persists across all attempts.
 */
export async function resilientFetch(
  url: string | URL,
  opts: ResilientFetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    headers,
    next,
    method = "GET",
    body,
  } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        ...(next ? { next } : {}),
      });
      // Retry transient server/rate-limit statuses (but not the last attempt).
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const wait = retryAfterMs(res) ?? backoffMs(attempt);
        clearTimeout(timer);
        await sleep(wait);
        continue;
      }
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await sleep(backoffMs(attempt));
        continue;
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Request to ${String(url)} failed`);
}
