import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * OpenCitations Index API — independent, open citation counts by DOI.
 *
 * OpenCitations builds its citation graph from Crossref/other open reference
 * corpora, INDEPENDENTLY of OpenAlex's own indexing pipeline. The two rarely
 * agree exactly (different citing-reference coverage), so surfacing both is an
 * honest multi-source signal rather than a "more accurate" replacement of
 * OpenAlex's `citedByCount`. Free, no auth. Fails soft (returns null/[]) so an
 * OpenCitations hiccup never breaks a sync.
 *
 * TODO(verify-live): the dev environment has no outbound internet, so the exact
 * response shape below is unverified against the live API. Documented shape
 * (OpenCitations Index v2, "citation-count" operation):
 *   GET https://api.opencitations.net/index/v2/citation-count/doi:<doi>
 *   → 200 with a JSON array of one object: `[{ "count": "12" }]` (count is
 *     reportedly returned as a STRING in the v2 API, hence `Number(...)` below).
 * The parser also tolerates a bare object (`{ count: 12 }`, no array wrapper) and
 * a numeric `count`, in case the shape differs from the documented one.
 */

const OPENCITATIONS_API = "https://api.opencitations.net/index/v2/citation-count";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
// A citation-count response is a handful of bytes; cap generously against a
// pathological response.
const MAX_BYTES = 10_000;

/** A DOI is "10.<registrant>/<suffix>". Reject anything else before building a URL. */
const DOI_RE = /^10\.\d{4,9}\/\S+$/;

function bareDoi(doi: string): string | null {
  const bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  return DOI_RE.test(bare) ? bare : null;
}

/** Extract a non-negative integer count from one parsed record, tolerating a
 *  string or numeric `count` field. Returns undefined when absent/invalid. */
function countFrom(record: unknown): number | undefined {
  if (typeof record !== "object" || record === null) return undefined;
  const raw = (record as Record<string, unknown>).count;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/**
 * Fetch the OpenCitations citation count for a single DOI. Returns null on any
 * failure, malformed response, or when the DOI has no OpenCitations record.
 */
export async function fetchOpenCitationsCount(doi: string): Promise<number | null> {
  const bare = bareDoi(doi);
  if (!bare) return null;

  const url = `${OPENCITATIONS_API}/doi:${encodeURIComponent(bare)}`;

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 }, // citation counts move slowly; cache a day
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;

    const body = await res.text();
    if (body.length > MAX_BYTES) return null;
    const data: unknown = JSON.parse(body);

    // Documented shape: a one-element array. Defensively also accept a bare object.
    if (Array.isArray(data)) {
      const count = countFrom(data[0]);
      return count ?? null;
    }
    return countFrom(data) ?? null;
  } catch (err) {
    logger.warn("opencitations.fetch_failed", { err });
    return null;
  }
}
