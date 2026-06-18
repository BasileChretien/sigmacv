import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import {
  normalizeOrcid,
  shortId,
  type OpenAlexAuthor,
  type OpenAlexListResponse,
  type OpenAlexWork,
} from "./types";

// Overridable so E2E tests can point at a local fixture server (a server-side
// fetch is invisible to Playwright's page.route). Defaults to the real API.
// IGNORED in production: respecting it there would let a misconfigured/poisoned
// env exfiltrate users' OPENALEX_MAILTO + ORCID iDs to an arbitrary host.
const OPENALEX_API =
  process.env.NODE_ENV !== "production" && process.env.OPENALEX_API_BASE
    ? process.env.OPENALEX_API_BASE
    : "https://api.openalex.org";

// Only request the fields we need (smaller, faster responses).
const WORK_SELECT = [
  "id",
  "doi",
  "title",
  "display_name",
  "publication_year",
  "publication_date",
  // Inverted-index abstract — reconstructed into a bounded `csl.abstract` for the
  // public page's expandable-abstract affordance (toCsl.ts). Adds to the payload but
  // rides the existing request (no extra call).
  "abstract_inverted_index",
  "type",
  "type_crossref",
  "language",
  "cited_by_count",
  "fwci",
  "cited_by_percentile_year",
  "authorships",
  "open_access",
  "primary_location",
  "best_oa_location",
  "biblio",
  "ids",
  // OpenAlex replaced the old `grants` field with `awards` (award number + funder
  // id/name). We use it only to attach funder identifiers to a user's own ORCID
  // grants (see build.ts `indexFundersByAward`), never as a standalone source.
  "awards",
  // Primary research topic (field + domain), reduced and stored on the item for the
  // misattribution heuristic's cross-domain check. Rides the existing request (no
  // extra call); `select` keeps the payload small.
  "primary_topic",
].join(",");

async function openAlexGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${OPENALEX_API}${path}`);
  const mailto = getEnv().OPENALEX_MAILTO;
  // Polite pool: identify ourselves on every request.
  url.searchParams.set("mailto", mailto);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await resilientFetch(url, {
    headers: {
      Accept: "application/json",
      // Polite-pool identification (in addition to the mailto query param).
      "User-Agent": `SigmaCV (mailto:${mailto})`,
    },
    // OpenAlex data changes slowly; let Next cache for an hour.
    next: { revalidate: 3600 },
    timeoutMs: 15_000,
  });
  if (!res.ok) {
    throw new Error(
      `OpenAlex request failed (${res.status} ${res.statusText}) for ${url.pathname}`,
    );
  }
  return (await res.json()) as T;
}

/** Find all OpenAlex author records carrying a given ORCID iD. */
export async function fetchAuthorsByOrcid(orcid: string): Promise<OpenAlexAuthor[]> {
  const bare = normalizeOrcid(orcid);
  const data = await openAlexGet<OpenAlexListResponse<OpenAlexAuthor>>("/authors", {
    filter: `orcid:${bare}`,
    "per-page": "50",
  });
  return data.results ?? [];
}

/**
 * Fetch every work attributed to any of the given OpenAlex author ids.
 * Uses OR (`|`) filtering plus cursor pagination. `maxPages` guards against
 * pathological accounts; we log if we hit it rather than silently truncating.
 */
export async function fetchWorksByAuthorIds(
  authorIds: string[],
  maxPages = 25,
): Promise<OpenAlexWork[]> {
  const ids = authorIds.map(shortId).filter(Boolean);
  if (ids.length === 0) return [];

  const filter = `author.id:${ids.join("|")}`;
  const out: OpenAlexWork[] = [];
  let cursor: string | null = "*";
  let pages = 0;

  while (cursor && pages < maxPages) {
    const data: OpenAlexListResponse<OpenAlexWork> = await openAlexGet<
      OpenAlexListResponse<OpenAlexWork>
    >("/works", {
      filter,
      "per-page": "200",
      cursor,
      select: WORK_SELECT,
    });
    out.push(...(data.results ?? []));
    cursor = data.meta?.next_cursor ?? null;
    pages += 1;
    if (!data.results || data.results.length === 0) break;
  }

  if (cursor && pages >= maxPages) {
    logger.warn("openalex.works_truncated", {
      maxPages,
      authorCount: ids.length,
      fetched: out.length,
    });
  }
  return out;
}

/** Normalize a user-supplied DOI to its bare form ("10.xxxx/yyyy"): strip a
 *  scheme / doi.org / "doi:" prefix and lower-case. Returns null if it doesn't
 *  look like a DOI, so a junk lookup never hits the API. */
export function bareDoiInput(input: string): string | null {
  const v = (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "")
    .trim();
  // The bare DOI is interpolated into the request path (`/works/doi:<bare>`), so
  // it must not be able to re-target that path or its query string. Disallow
  // whitespace, `?`, `#`, `%` and backslash (which could inject a query/fragment
  // or an encoded separator), and reject `..` path-traversal segments. A real
  // DOI suffix never needs any of these.
  if (!/^10\.\d{4,9}\/[^\s?#%\\]+$/.test(v)) return null;
  if (v.includes("..")) return null;
  return v;
}

/**
 * Fetch a SINGLE work by DOI (the user's "add a work by DOI" claim flow). All
 * the work's metadata — year, citations, FWCI, author positions — comes from
 * OpenAlex, so figures stay source-driven. Returns null when the DOI is
 * malformed or OpenAlex has no record (404) / a transient error: the caller
 * surfaces "not found" rather than throwing into the request.
 */
export async function fetchWorkByDoi(doi: string): Promise<OpenAlexWork | null> {
  const bare = bareDoiInput(doi);
  if (!bare) return null;
  try {
    return await openAlexGet<OpenAlexWork>(`/works/doi:${bare}`, {
      select: WORK_SELECT,
    });
  } catch (err) {
    logger.warn("openalex.work_by_doi_failed", { err });
    return null;
  }
}

/** Minimal OpenAlex "source" (journal) shape we read for ISSN → name. */
interface OpenAlexSource {
  display_name?: string;
  issn_l?: string | null;
  issn?: string[] | null;
}

/**
 * Resolve journal ISSNs to their display names (OpenAlex "sources"). Used to
 * label peer-review activity by JOURNAL rather than by the convening
 * organization/publisher that ORCID records. Returns an issn → name map; ISSNs
 * that don't resolve are simply absent (the caller falls back). Fails soft.
 */
export async function fetchJournalNamesByIssn(issns: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(issns.map((s) => s.trim()).filter(Boolean))];
  if (unique.length === 0) return out;

  // OpenAlex OR-filter (`|`); chunk so the URL/filter stays reasonable.
  const CHUNK = 40;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const batch = unique.slice(i, i + CHUNK);
    try {
      const data = await openAlexGet<OpenAlexListResponse<OpenAlexSource>>("/sources", {
        filter: `issn:${batch.join("|")}`,
        select: "display_name,issn,issn_l",
        "per-page": "200",
      });
      for (const src of data.results ?? []) {
        const name = src.display_name?.trim();
        if (!name) continue;
        // Map every ISSN the source carries (print + electronic + linking) to
        // the name, so whichever ISSN ORCID recorded resolves.
        for (const issn of src.issn ?? []) if (issn) out.set(issn, name);
        if (src.issn_l) out.set(src.issn_l, name);
      }
    } catch (err) {
      logger.warn("openalex.sources_by_issn_failed", { err });
      // leave this batch unresolved; the caller falls back to the publisher.
    }
  }
  return out;
}
