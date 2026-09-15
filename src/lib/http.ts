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
  /** `"no-store"` keeps a request out of Next's data cache entirely — required
   *  when any part of the URL is chosen by an anonymous visitor, since each
   *  distinct URL would otherwise write a disk entry. Pass `next: undefined`
   *  alongside it. */
  cache?: "no-store";
  /** `PUT` exists for the idempotent DataCite DOI update (tombstone). */
  method?: "GET" | "POST" | "PUT";
  body?: BodyInit;
  /**
   * Redirect handling (default: fetch's `"follow"`). Trusted, hard-coded hosts
   * (OpenAlex, ORCID, …) leave this unset. Callers fetching a USER-SUPPLIED URL
   * that they SSRF-validated up front MUST pass `"error"` so a 3xx to an internal
   * target can't bypass that check by being silently followed.
   */
  redirect?: RequestRedirect;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const MAX_BACKOFF_MS = 8_000;
/**
 * Cap on ONE `Retry-After` wait. The header is honoured (it is the polite
 * thing to do) but an upstream asking for an hour would otherwise hold a sync
 * — or a whole cron tick, which now makes a few hundred paced calls — hostage
 * to a single response; past this the request simply retries and, if still
 * rate-limited, fails fast to the caller's fail-soft path.
 */
const MAX_RETRY_AFTER_MS = 30_000;

function backoffMs(attempt: number): number {
  // 400ms, 800ms, 1600ms … capped.
  return Math.min(MAX_BACKOFF_MS, 400 * 2 ** attempt);
}

function retryAfterMs(res: Response): number | null {
  const ra = res.headers.get("retry-after");
  if (!ra) return null;
  const secs = Number(ra);
  return Number.isFinite(secs) ? Math.min(MAX_RETRY_AFTER_MS, secs * 1000) : null;
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
    cache,
    method = "GET",
    body,
    redirect,
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
        ...(cache ? { cache } : {}),
        ...(redirect ? { redirect } : {}),
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
  throw lastErr instanceof Error ? lastErr : new Error(`Request to ${String(url)} failed`);
}

/**
 * A response body as text, read chunk by chunk against a deadline (epoch ms) and
 * a byte cap: undefined when there is no body, when it stalls past the deadline or
 * when it grows past `maxBytes` — the stream is then cancelled at once, never
 * buffered whole first. {@link resilientFetch}'s timeout stops at the headers, so a
 * caller holding a wall-clock budget reads the body through this.
 */
export async function readBodyWithin(
  res: Response,
  deadline: number,
  maxBytes: number,
): Promise<string | undefined> {
  const reader = res.body?.getReader();
  if (!reader) return undefined;
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<"timed-out">((resolve) => {
        timer = setTimeout(() => resolve("timed-out"), Math.max(0, deadline - Date.now()));
      });
      const chunk = await Promise.race([reader.read(), timedOut]).finally(() =>
        clearTimeout(timer),
      );
      if (chunk === "timed-out") return undefined;
      if (chunk.done) return text + decoder.decode();
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) return undefined;
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    /* v8 ignore next -- cancelling a finished or errored stream is fail-soft by design */
    void reader.cancel().catch(() => undefined);
  }
}
