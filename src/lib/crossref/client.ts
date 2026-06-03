import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import type { CslItem } from "@/types/csl";

/**
 * Crossref REST API — bibliographic metadata GAP-FILL by DOI.
 *
 * OpenAlex is the primary works source, but it occasionally lacks the journal
 * name, volume/issue or page range (common for chapters, conference papers and
 * older records). Crossref can return CSL-JSON directly via content negotiation,
 * so we fetch it for works that have a DOI but are missing those fields and fill
 * ONLY the gaps — never overwriting data OpenAlex already provided.
 *
 * Free, no auth. We join the polite pool with a `mailto`. Every call fails soft
 * (returns null) so a Crossref hiccup never breaks a sync.
 */

const CROSSREF_API = "https://api.crossref.org/works";
const CSL_ACCEPT = "application/vnd.citationstyles.csl+json";
// A single CSL record is small; cap the body to reject a pathological response.
const MAX_BYTES = 200_000;

/** A DOI is "10.<registrant>/<suffix>". Reject anything else before building a URL. */
const DOI_RE = /^10\.\d{4,9}\/\S+$/;

/** The subset of CSL fields we trust Crossref to supply as gap-fill. */
export type CrossrefGapFields = Pick<
  CslItem,
  "container-title" | "volume" | "issue" | "page" | "ISSN" | "publisher"
>;

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? first.trim() : undefined;
  }
  return undefined;
}

function issnList(value: unknown): string | string[] | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === "string" && !!v.trim());
    return list.length ? list : undefined;
  }
  return undefined;
}

/**
 * Fetch Crossref CSL-JSON for a DOI and return only the bibliographic gap-fill
 * fields (or null on any failure / non-CSL response).
 */
export async function fetchCrossrefGapFields(
  doi: string,
  mailto: string,
): Promise<CrossrefGapFields | null> {
  const bare = doi.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!DOI_RE.test(bare)) return null;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: CSL_ACCEPT },
      next: { revalidate: 86_400 }, // bibliographic metadata is effectively static
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;

    const len = Number(res.headers.get("content-length"));
    if (Number.isFinite(len) && len > MAX_BYTES) return null;
    const body = await res.text();
    if (body.length > MAX_BYTES) return null;

    const data = JSON.parse(body) as Record<string, unknown>;
    const out: CrossrefGapFields = {};
    const container = firstString(data["container-title"]);
    if (container) out["container-title"] = container;
    const volume = firstString(data.volume);
    if (volume) out.volume = volume;
    const issue = firstString(data.issue);
    if (issue) out.issue = issue;
    const page = firstString(data.page);
    if (page) out.page = page;
    const issn = issnList(data.ISSN);
    if (issn) out.ISSN = issn;
    const publisher = firstString(data.publisher);
    if (publisher) out.publisher = publisher;

    return Object.keys(out).length > 0 ? out : null;
  } catch (err) {
    logger.warn("crossref.fetch_failed", { err });
    return null;
  }
}
