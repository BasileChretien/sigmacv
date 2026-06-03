import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
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
  "type",
  "type_crossref",
  "language",
  "cited_by_count",
  "fwci",
  "cited_by_percentile_year",
  "authorships",
  "open_access",
  "primary_location",
  "biblio",
  "ids",
].join(",");

async function openAlexGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${OPENALEX_API}${path}`);
  // Polite pool: identify ourselves on every request.
  url.searchParams.set("mailto", getEnv().OPENALEX_MAILTO);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const mailto = getEnv().OPENALEX_MAILTO;
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
export async function fetchAuthorsByOrcid(
  orcid: string,
): Promise<OpenAlexAuthor[]> {
  const bare = normalizeOrcid(orcid);
  const data = await openAlexGet<OpenAlexListResponse<OpenAlexAuthor>>(
    "/authors",
    { filter: `orcid:${bare}`, "per-page": "50" },
  );
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
    console.warn(
      `[openalex] hit maxPages=${maxPages} for authors ${ids.join(",")}; ` +
        `${out.length} works fetched, more may exist.`,
    );
  }
  return out;
}
