import { ROR_ID_PATTERN } from "@/lib/ror/id";
import {
  shortOpenAlexId,
  type CountedGroup,
  type InstitutionEntity,
} from "@/lib/institutions/snapshot";
import { openAlexError, openAlexGet, openAlexResponse } from "./client";

/**
 * OpenAlex institution fetchers for the organisation snapshot — called ONLY by
 * the refresh job on the internal resync tick (`institutionRefresh.ts`), never
 * from a request: the `/i/[ror]` page reads the stored row (the plan's "Live
 * proxying" veto, enforced by `tests/institutions-no-openalex.test.ts`).
 *
 * Endpoints, filters and `group_by` keys are the ones verified against the
 * production API on 2026-09-08:
 *
 * - `GET /institutions/ror:<bare id>?select=id,display_name,ror,works_count,lineage,associated_institutions`
 *   — `lineage` is self + ancestors as `I…` URIs; `associated_institutions[]`
 *   carries `relationship ∈ parent | child | related` (a hospital is `related`).
 * - `GET /works?filter=authorships.institutions.lineage:I…|I…,<more>&group_by=<key>`
 *   with `key ∈ publication_year | open_access.oa_status | authorships.countries |
 *   authorships.institutions.lineage`; `authorships.institutions.ror:<bare id>`
 *   also works. Response: `{ meta: { count }, group_by: [{ key, key_display_name, count }] }`.
 *
 * Bounded: `per-page=200`, no paging (OpenAlex caps `group_by` at 200 groups).
 * Nothing user-supplied ever reaches a URL: the ROR id is validated by shape,
 * the institution ids by shape, and a filter may not carry a separator.
 */

const INSTITUTION_SELECT = "id,display_name,ror,works_count,lineage,associated_institutions";

/** The `group_by` keys the snapshot uses (verified). */
export type WorksGroupBy =
  | "publication_year"
  | "open_access.oa_status"
  | "authorships.countries"
  | "authorships.institutions.lineage";

/** A short OpenAlex institution id. */
const OPENALEX_INSTITUTION_ID = /^I\d+$/;
/** One OpenAlex filter clause (`field:value`), with no `,` that could append
 *  another clause. Values may carry `|` (OR), `-` (range), `!` (NOT). */
const FILTER_CLAUSE = /^[a-z_.]+:[A-Za-z0-9|!._-]+$/;

interface RawAssociatedInstitution {
  id?: string | null;
  ror?: string | null;
  display_name?: string | null;
  relationship?: string | null;
}

interface RawInstitution {
  id?: string | null;
  display_name?: string | null;
  works_count?: number | null;
  lineage?: string[] | null;
  associated_institutions?: RawAssociatedInstitution[] | null;
}

interface RawGroupBy {
  meta?: { count?: number | null } | null;
  group_by?: Array<{
    key?: string | number | null;
    key_display_name?: string | null;
    count?: number | null;
  }> | null;
}

function bareRor(ror: string | null | undefined): string | undefined {
  if (!ror) return undefined;
  const bare = ror.replace(/^https:\/\/ror\.org\//, "");
  return ROR_ID_PATTERN.test(bare) ? bare : undefined;
}

/**
 * The institution OpenAlex records for a bare ROR id, reduced to what the
 * snapshot needs, or null when the value is not ROR-shaped (no request is
 * made) or OpenAlex has no entity for it (404). Any other failure throws —
 * the refresh job records it and backs off.
 */
export async function fetchInstitutionByRor(ror: string): Promise<InstitutionEntity | null> {
  if (!ROR_ID_PATTERN.test(ror)) return null;
  const path = `/institutions/ror:${ror}`;
  const res = await openAlexResponse(path, { select: INSTITUTION_SELECT });
  if (res.status === 404) return null;
  if (!res.ok) throw openAlexError(res, path);
  const raw = (await res.json()) as RawInstitution;
  if (!raw.id) return null;
  const related = (raw.associated_institutions ?? []).flatMap((a) => {
    if (!a.id) return [];
    const ror = bareRor(a.ror);
    return [
      {
        id: shortOpenAlexId(a.id),
        ...(ror ? { ror } : {}),
        name: a.display_name ?? "",
        relationship: a.relationship ?? "",
      },
    ];
  });
  return {
    openalexId: shortOpenAlexId(raw.id),
    displayName: raw.display_name ?? "",
    lineage: (raw.lineage ?? []).map(shortOpenAlexId),
    related,
    worksCount: raw.works_count ?? 0,
  };
}

export interface GroupWorksQuery {
  /** Short OpenAlex institution ids whose lineage the works must carry
   *  (OR-joined). Either this or `rorId`. */
  lineageIds?: string[];
  /** A bare ROR id (`authorships.institutions.ror`). Either this or `lineageIds`. */
  rorId?: string;
  /** Further filter clauses, e.g. `type:article|review`, `publication_year:2024`. */
  filters?: string[];
  groupBy: WorksGroupBy;
}

/** The institution clause of a works filter, validated by shape. */
function institutionClause(q: GroupWorksQuery): string {
  if (q.rorId !== undefined) {
    if (!ROR_ID_PATTERN.test(q.rorId)) throw new Error("groupWorks: not a bare ROR id");
    return `authorships.institutions.ror:${q.rorId}`;
  }
  const ids = (q.lineageIds ?? []).map(shortOpenAlexId);
  if (ids.length === 0 || !ids.every((id) => OPENALEX_INSTITUTION_ID.test(id))) {
    throw new Error("groupWorks: expected OpenAlex institution ids (I…)");
  }
  return `authorships.institutions.lineage:${ids.join("|")}`;
}

/**
 * Count works grouped by one key, for the works carrying the institution(s):
 * one bounded request, `{ groups, total }` where `total` is the number of
 * works matching the whole filter (the denominator the page shows).
 */
export async function groupWorks(q: GroupWorksQuery): Promise<{
  groups: CountedGroup[];
  total: number;
}> {
  const clauses = [institutionClause(q), ...(q.filters ?? [])];
  for (const clause of clauses.slice(1)) {
    if (!FILTER_CLAUSE.test(clause)) throw new Error(`groupWorks: malformed filter ${clause}`);
  }
  const data = await openAlexGet<RawGroupBy>("/works", {
    filter: clauses.join(","),
    group_by: q.groupBy,
    "per-page": "200",
  });
  const groups = (data.group_by ?? []).flatMap((g) => {
    if (g.key === null || g.key === undefined) return [];
    const key = String(g.key);
    return [{ key, label: g.key_display_name ?? key, count: g.count ?? 0 }];
  });
  return { groups, total: data.meta?.count ?? 0 };
}
