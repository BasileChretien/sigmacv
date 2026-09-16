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
 * Zenodo — the general repository SigmaCV routes to when nothing closer fits,
 * asked for a record that cites the article's DOI as a related identifier (a
 * deposited manuscript carries the publisher's DOI as "is identical to" or
 * "is version of"; a record whose own DOI is the article's is caught too).
 *
 *   GET https://zenodo.org/api/records?q=related.identifier:"<doi>" OR doi:"<doi>"&size=3
 *   → `{ hits: { hits: [{ id, metadata: { access_right, publication_date },
 *       links: { self_html } }] } }` (verified live 2026-09-16).
 *
 * Keyless; guests are limited to about one request per second — at two per
 * second a probe got 429 on 8 of 51 (2026-09-16), so the pass spaces its Zenodo
 * calls ({@link ZENODO_MIN_INTERVAL_MS}) and a 429 is a failure to retry later,
 * not an answer. A copy has a file when the record is open; a restricted or
 * embargoed record is a copy without one.
 */

const ZENODO_API = "https://zenodo.org/api/records";
export const ZENODO_MIN_INTERVAL_MS = 1_100;

interface Hit {
  id?: unknown;
  metadata?: { access_right?: unknown; publication_date?: unknown };
  links?: { self_html?: unknown };
}

export async function lookupZenodoCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(ZENODO_API);
  const term = bare.replace(/(["\\])/g, "\\$1");
  url.searchParams.set("q", `related.identifier:"${term}" OR doi:"${term}"`);
  url.searchParams.set("size", "3");
  const data = await getJson(url, mailto, timeoutMs);
  if (data === undefined) return FAILED;
  if (data === null) return NONE;
  const hits = (data as { hits?: { hits?: unknown } }).hits?.hits;
  if (!Array.isArray(hits)) return FAILED;
  const copies: RepositoryCopy[] = [];
  for (const raw of hits as Hit[]) {
    const id = typeof raw.id === "number" ? String(raw.id) : text(raw.id, COPY_LIMITS.id);
    if (!id || !/^\d+$/.test(id)) continue;
    const page = text(raw.links?.self_html, COPY_LIMITS.url);
    copies.push({
      source: "zenodo",
      id,
      url:
        page && /^https:\/\/zenodo\.org\//.test(page) ? page : `https://zenodo.org/records/${id}`,
      hasFile: raw.metadata?.access_right === "open",
      name: "Zenodo",
      recorded: isoDate(raw.metadata?.publication_date),
    });
  }
  return copies.length ? { status: "found", copies: bestFirst(copies) } : NONE;
}
