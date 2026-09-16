import {
  bareDoi,
  COPY_LIMITS,
  COPY_TIMEOUT_MS,
  FAILED,
  getJson,
  NONE,
  text,
  type CopyLookup,
  type RepositoryCopy,
} from "./shared";

/**
 * OpenAIRE — the aggregator that harvests thousands of repositories (the
 * institutional DSpace and EPrints instances, HAL, Zenodo, PMC…), asked by DOI.
 *
 *   GET https://api.openaire.eu/search/publications?doi=<doi>&format=json&size=5
 *   → `{ response: { results: { result: [{ metadata: { "oaf:entity": {
 *       "oaf:result": { children: { instance: [{ hostedby: { "@name" },
 *       accessright: { "@classid": "OPEN"|"CLOSED"|"UNKNOWN"|… },
 *       webresource: { url } }] } } } } }] } } }` — `instance` and `webresource`
 *     come as an object when there is one, an array otherwise (verified live
 *     2026-09-16 on 51 DOIs: 15 known, none OPEN — the aggregator lags and keeps
 *     HAL notices as "Unknown Repository:UNKNOWN").
 *
 * Keyless, polite by the User-Agent. A copy is an instance with access right
 * OPEN whose page is not the DOI itself: on a work OpenAlex calls closed, an open
 * instance OpenAIRE knows is almost always a repository copy the aggregator saw
 * and OpenAlex did not. The host's name is kept, so the worklist can say where.
 */

const OPENAIRE_API = "https://api.openaire.eu/search/publications";

type One<T> = T | T[] | undefined;
const list = <T>(v: One<T>): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

interface Instance {
  hostedby?: { "@name"?: unknown; "@id"?: unknown };
  accessright?: { "@classid"?: unknown };
  webresource?: One<{ url?: unknown }>;
}

export async function lookupOpenaireCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(OPENAIRE_API);
  url.searchParams.set("doi", bare);
  url.searchParams.set("format", "json");
  url.searchParams.set("size", "5");
  const data = await getJson(url, mailto, timeoutMs);
  if (data === undefined) return FAILED;
  if (data === null) return NONE;
  const results = (data as { response?: { results?: { result?: unknown } } }).response?.results;
  if (results === undefined || results === null) return NONE;
  const records = list((results as { result?: One<unknown> }).result);
  const copies: RepositoryCopy[] = [];
  for (const record of records) {
    const entity = (record as { metadata?: { "oaf:entity"?: { "oaf:result"?: unknown } } })
      .metadata?.["oaf:entity"]?.["oaf:result"] as { children?: { instance?: One<Instance> } };
    for (const inst of list(entity?.children?.instance)) {
      if (inst.accessright?.["@classid"] !== "OPEN") continue;
      const page = list(inst.webresource)
        .map((w) => text(w.url, COPY_LIMITS.url))
        .find((u): u is string => u !== undefined && /^https?:\/\//i.test(u));
      if (!page || /^https?:\/\/(dx\.)?doi\.org\//i.test(page)) continue;
      const name = text(inst.hostedby?.["@name"], COPY_LIMITS.name);
      const id = text(inst.hostedby?.["@id"], COPY_LIMITS.id) ?? page.slice(0, COPY_LIMITS.id);
      copies.push({ source: "openaire", id, url: page, hasFile: true, name });
    }
  }
  return copies.length ? { status: "found", copies: copies.slice(0, COPY_LIMITS.perSource) } : NONE;
}
