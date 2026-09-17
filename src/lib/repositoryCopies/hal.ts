import {
  bareDoi,
  bestFirst,
  COPY_LIMITS,
  COPY_TIMEOUT_MS,
  FAILED,
  getJson,
  isoDate,
  NONE,
  text,
  type CopyLookup,
  type RepositoryCopy,
} from "./shared";

/**
 * HAL — the French national open archive, asked directly by DOI.
 *
 *   GET https://api.archives-ouvertes.fr/search/?q=doiId_s:"<doi>"
 *       &fl=halId_s,submittedDate_s,openAccess_bool&wt=json
 *   → `{ response: { numFound, docs: [{ halId_s, submittedDate_s,
 *       openAccess_bool }] } }` (verified live 2026-09-16 on 51 DOIs). HAL
 *     indexes `doiId_s` in lower case, so the term is lowered (a DOI is
 *     case-insensitive).
 *
 * Keyless, no documented rate limit (the pass makes one call per work, a few
 * in flight at once, under a budget). `openAccess_bool` says whether a FILE is open
 * on the record: a HAL "notice" without one is a metadata record, common in
 * France where labs create notices in bulk — for those the right action is to
 * add the manuscript to the notice, not to deposit a duplicate. The record page
 * is `https://hal.science/<halId>`.
 */

const HAL_API = "https://api.archives-ouvertes.fr/search/";
const HAL_RECORD = "https://hal.science/";

interface HalDoc {
  halId_s?: unknown;
  submittedDate_s?: unknown;
  openAccess_bool?: unknown;
}

export async function lookupHalCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(HAL_API);
  // A quoted Solr term: the DOI's own quotes and backslashes escaped.
  url.searchParams.set("q", `doiId_s:"${bare.toLowerCase().replace(/(["\\])/g, "\\$1")}"`);
  url.searchParams.set("fl", "halId_s,submittedDate_s,openAccess_bool");
  url.searchParams.set("wt", "json");
  url.searchParams.set("rows", "5");
  const data = await getJson(url, mailto, timeoutMs);
  if (data === undefined) return FAILED;
  if (data === null) return NONE;
  const docs = (data as { response?: { docs?: unknown } }).response?.docs;
  if (!Array.isArray(docs)) return FAILED;
  const copies: RepositoryCopy[] = [];
  for (const raw of docs as HalDoc[]) {
    const id = text(raw.halId_s, COPY_LIMITS.id);
    if (!id || !/^[a-z]+-\d+$/i.test(id)) continue;
    copies.push({
      source: "hal",
      id,
      url: `${HAL_RECORD}${id}`,
      hasFile: raw.openAccess_bool === true,
      recorded: isoDate(raw.submittedDate_s),
    });
  }
  return copies.length ? { status: "found", copies: bestFirst(copies) } : NONE;
}
