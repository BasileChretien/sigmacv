import {
  bareDoi,
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
 * OpenAIRE — the aggregator that harvests thousands of repositories (the
 * institutional DSpace and EPrints instances, HAL, Zenodo, PMC…), asked by DOI
 * on the Graph API (the older Search API was announced phased out on
 * 2026-05-31):
 *
 *   GET https://api.openaire.eu/graph/v1/researchProducts?pid=<doi>&pageSize=3
 *   → `{ header: { numFound }, results: [{ id, isGreen, bestAccessRight: { label },
 *       publicationDate, instances: [{ urls: [...], license?, pids?, … }] }] }`
 *     (verified live 2026-09-17 on three DOIs; an unknown DOI answers 200 with
 *     `numFound: 0`; the instances carry NO access right and NO host).
 *
 * So the copy rule is OpenAIRE's own verdict: a record it marks `isGreen` — a
 * copy is open in a repository it harvests (a preprint server counts, as for
 * HAL) — is a copy WITH a file, pointed at the OpenAIRE record page: the
 * instances do not say which of their pages is the repository's (the
 * publisher's own PDF link sits among them), so none is guessed. A record not
 * green is no copy, whatever its instances say (a DOAJ journal page is not a
 * repository). A 404 from a SEARCH endpoint is a failure, never "no records".
 *
 * Quota: 60 calls an hour per address anonymously, 7 200 with the access
 * token `openaire/auth.ts` holds — the pass hands it over (a CV would spend the
 * anonymous hour in one sync). Polite by the User-Agent.
 */

const OPENAIRE_API = "https://api.openaire.eu/graph/v1/researchProducts";
const RECORD_PAGE = "https://explore.openaire.eu/search/result?id=";

interface Product {
  id?: unknown;
  isGreen?: unknown;
  bestAccessRight?: { label?: unknown };
  publicationDate?: unknown;
}

export async function lookupOpenaireCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
  token: string | null = null,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(OPENAIRE_API);
  url.searchParams.set("pid", bare.toLowerCase());
  url.searchParams.set("pageSize", "3");
  const data = await getJson(
    url,
    mailto,
    timeoutMs,
    token ? { Authorization: `Bearer ${token}` } : {},
  );
  // A search endpoint that 404s did not say "nothing": it failed.
  if (data === undefined || data === null) return FAILED;
  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results)) return FAILED;
  const copies: RepositoryCopy[] = [];
  for (const raw of results as Product[]) {
    const id = text(raw?.id, COPY_LIMITS.id);
    if (!id || raw.isGreen !== true || raw.bestAccessRight?.label !== "OPEN") continue;
    copies.push({
      source: "openaire",
      id,
      url: `${RECORD_PAGE}${encodeURIComponent(id)}`,
      hasFile: true,
      name: "OpenAIRE",
      recorded: isoDate(raw.publicationDate),
    });
  }
  return copies.length ? { status: "found", copies: copies.slice(0, COPY_LIMITS.perSource) } : NONE;
}
