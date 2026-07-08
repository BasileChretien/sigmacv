import { logger } from "@/lib/log";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * IndexNow key. PUBLIC by design (NOT a secret): IndexNow verifies we control
 * the domain by fetching `https://<host>/<key>.txt` and checking it equals this
 * value — so the same string is committed at
 * `public/7d6ed958271a1db2cd36efd2179e1d95.txt`. Keep the two in sync.
 */
export const INDEXNOW_KEY = "7d6ed958271a1db2cd36efd2179e1d95";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow caps a single submission at 10,000 URLs. */
const MAX_URLS = 10_000;

/**
 * Tell IndexNow participants (Bing, Yandex, Seznam, …) that public URLs were
 * just published or changed, so they crawl them promptly instead of waiting to
 * rediscover them via the sitemap. It COMPLEMENTS — never replaces — the
 * sitemap, and Google ignores IndexNow entirely.
 *
 * Best-effort and fail-soft: it NEVER throws (a publish/sync must not break if
 * the ping fails) and only runs in production. The production guard is
 * load-bearing — `SITE_URL` falls back to the real https://sigmacv.org when
 * NEXT_PUBLIC_SITE_URL is unset (dev/test), so without it a local run would
 * ping live URLs. Only same-origin URLs are submitted (IndexNow rejects a
 * host/key mismatch anyway).
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const urlList = urls.filter((u) => u.startsWith(`${SITE_URL}/`)).slice(0, MAX_URLS);
  if (urlList.length === 0) return;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    if (!res.ok) {
      logger.warn("indexnow.ping_non_2xx", { status: res.status, count: urlList.length });
    }
  } catch (err) {
    logger.warn("indexnow.ping_failed", { err });
  }
}
