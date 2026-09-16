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
 * asked for a record that names the article's DOI. Only a PUBLICATION record
 * that IS the article counts: its own DOI is the article's, or it relates to
 * the DOI as "is identical to", "is version of" or "is variant form of" — the
 * way a deposited manuscript carries the publisher's DOI. The dataset, code or
 * slides of a paper cite its DOI too ("is supplement to", "cites") and are not
 * a copy of it; a metadata-only record (allowed since 2023), or one whose files
 * the answer does not list, has no file.
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
  metadata?: {
    access_right?: unknown;
    publication_date?: unknown;
    doi?: unknown;
    resource_type?: { type?: unknown };
    related_identifiers?: unknown;
  };
  files?: unknown;
  links?: { self_html?: unknown };
}

/** The relations under which a Zenodo record IS the article, not something about it. */
const SAME_WORK = new Set(["isidenticalto", "isversionof", "isvariantformof"]);

function isTheArticle(raw: Hit, doi: string): boolean {
  const own = typeof raw.metadata?.doi === "string" ? bareDoi(raw.metadata.doi) : undefined;
  if (own?.toLowerCase() === doi) return true;
  const related = raw.metadata?.related_identifiers;
  if (!Array.isArray(related)) return false;
  return related.some((entry) => {
    const rel = entry as { identifier?: unknown; relation?: unknown } | null;
    return (
      typeof rel?.identifier === "string" &&
      bareDoi(rel.identifier)?.toLowerCase() === doi &&
      typeof rel.relation === "string" &&
      SAME_WORK.has(rel.relation.toLowerCase())
    );
  });
}

export async function lookupZenodoCopy(
  doi: string,
  mailto?: string,
  timeoutMs: number = COPY_TIMEOUT_MS,
): Promise<CopyLookup> {
  const bare = bareDoi(doi);
  if (!bare) return NONE;
  const url = new URL(ZENODO_API);
  const lower = bare.toLowerCase();
  const term = lower.replace(/(["\\])/g, "\\$1");
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
    if (raw.metadata?.resource_type?.type !== "publication" || !isTheArticle(raw, lower)) continue;
    const page = text(raw.links?.self_html, COPY_LIMITS.url);
    copies.push({
      source: "zenodo",
      id,
      url:
        page && /^https:\/\/zenodo\.org\//.test(page) ? page : `https://zenodo.org/records/${id}`,
      hasFile:
        raw.metadata?.access_right === "open" && Array.isArray(raw.files) && raw.files.length > 0,
      name: "Zenodo",
      recorded: isoDate(raw.metadata?.publication_date),
    });
  }
  return copies.length ? { status: "found", copies: bestFirst(copies) } : NONE;
}
