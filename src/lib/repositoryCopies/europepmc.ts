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
 * Europe PMC — the biomedical full-text archive (PubMed Central included), asked
 * by DOI.
 *
 *   GET https://www.ebi.ac.uk/europepmc/webservices/rest/search
 *       ?query=DOI:"<doi>"&format=json&resultType=lite&pageSize=3
 *   → `{ resultList: { result: [{ pmid, pmcid, inEPMC: "Y"|"N",
 *       isOpenAccess, firstPublicationDate }] } }` (verified live 2026-09-16).
 *
 * Keyless, polite by the User-Agent. A hit counts only when the full text IS in
 * Europe PMC (`inEPMC` "Y" with a PMC id): an abstract-only PubMed record is no
 * copy. The record page is `https://europepmc.org/article/PMC/<pmcid>`.
 */

const EPMC_API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

interface EpmcResult {
  pmcid?: unknown;
  inEPMC?: unknown;
  firstPublicationDate?: unknown;
}

export async function lookupEuropePmcCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(EPMC_API);
  url.searchParams.set("query", `DOI:"${bare.toLowerCase().replace(/"/g, "")}"`);
  url.searchParams.set("format", "json");
  url.searchParams.set("resultType", "lite");
  url.searchParams.set("pageSize", "3");
  const data = await getJson(url, mailto, timeoutMs);
  if (data === undefined) return FAILED;
  if (data === null) return NONE;
  const results = (data as { resultList?: { result?: unknown } }).resultList?.result;
  if (!Array.isArray(results)) return FAILED;
  const copies: RepositoryCopy[] = [];
  for (const raw of results as EpmcResult[]) {
    const pmcid = text(raw.pmcid, COPY_LIMITS.id);
    if (raw.inEPMC !== "Y" || !pmcid || !/^PMC\d+$/.test(pmcid)) continue;
    copies.push({
      source: "europepmc",
      id: pmcid,
      url: `https://europepmc.org/article/PMC/${pmcid}`,
      hasFile: true,
      name: "Europe PMC",
      recorded: isoDate(raw.firstPublicationDate),
    });
  }
  return copies.length ? { status: "found", copies: copies.slice(0, COPY_LIMITS.perSource) } : NONE;
}
