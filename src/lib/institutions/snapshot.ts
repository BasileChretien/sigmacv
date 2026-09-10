import { z } from "zod";

/**
 * OpenAlex's record of an organisation, reduced to COUNTS — the pure half of
 * the institution snapshot. The refresh job (`openalex/institutionRefresh.ts`,
 * the only module that talks to OpenAlex about institutions) feeds the grouped
 * responses in here and stores the result on the `Institution` row; the
 * `/i/[ror]` page renders that stored row and nothing else. This module
 * therefore imports no client and knows no URL: it is inside the scope the
 * "no external call from an institution page" invariant test scans.
 *
 * Two facts verified against the production API on 2026-09-08 shape it:
 *
 * - A hospital is a `related` associated institution, NOT a lineage child (CHU
 *   de Caen Normandie is a separate entity from Université de Caen Normandie),
 *   so the works counted under an organisation are those of its own OpenAlex
 *   entity PLUS its related and child institutions ({@link foldedInstitutionIds}),
 *   never its parents (a parent would fold in every sibling university).
 * - The raw `counts_by_year` series is swamped by datasets in the current year
 *   (91,924 "works" for Nagoya in 2026), so every series here is restricted to
 *   {@link COUNTED_WORK_TYPES} and labelled as such.
 *
 * Counts only: no field here is ever a share, percentage or ratio — the
 * stored row is a set of counts (the plan's "Compliance verdicts" veto, as it
 * applies to storage). The ONE derived figure, the open share, is computed at
 * render by `oaShare.ts` from these counts alone (the owner's decision of
 * 2026-09-09, designed by the panel of 2026-09-10): printed beside its
 * numerator and denominator, withheld where a year is too small or not yet
 * complete, never stored, never sorted on, never differenced.
 */

/** The OpenAlex work types the series count: the publication-like outputs,
 *  datasets deliberately excluded (they swamp the current year). */
export const COUNTED_WORK_TYPES = ["article", "review", "book-chapter", "preprint"] as const;

/** OpenAlex's own OA statuses, in the order the page shows them; a status the
 *  API adds later sorts after these. */
export const OA_STATUS_ORDER = ["gold", "hybrid", "diamond", "green", "bronze", "closed"] as const;

/** Length of the top-countries and top-co-affiliations lists. */
export const TOP_N = 15;

/** The window: this many full years back, plus the current year. */
export const FULL_YEARS_BACK = 6;

/** Bound on the ids OR-joined into one works filter (the entity + its related
 *  and child institutions); a national system with hundreds of hospitals is
 *  truncated rather than turned into an unbounded query string. */
export const MAX_FOLDED_IDS = 50;

/** One `group_by` bucket as the fetcher returns it: OpenAlex key, its display
 *  name, and the count of matching works. */
export interface CountedGroup {
  key: string;
  label: string;
  count: number;
}

/** One entry of the entity's `associated_institutions`. */
export interface RelatedInstitution {
  /** Short OpenAlex id (`I…`). */
  id: string;
  /** Bare ROR id, when OpenAlex records one. */
  ror?: string;
  name: string;
  /** OpenAlex's `relationship`: `parent`, `child` or `related`. */
  relationship: string;
}

/** The institution entity, reduced by the fetcher to what the snapshot needs. */
export interface InstitutionEntity {
  /** Short OpenAlex id (`I…`). */
  openalexId: string;
  displayName: string;
  /** Short ids of the entity's lineage (self + ancestors). */
  lineage: string[];
  related: RelatedInstitution[];
  worksCount: number;
}

/** The grouped works counts the refresh job collects for one institution. */
export interface InstitutionGroupCounts {
  /** `group_by=publication_year` over the window, type-filtered. */
  byYear: CountedGroup[];
  /** `group_by=open_access.oa_status`, one query per year of the window. */
  oaByYear: Array<{ year: number; groups: CountedGroup[] }>;
  /** `group_by=authorships.countries` over the window. */
  countries: CountedGroup[];
  /** `group_by=authorships.institutions.lineage` over the window. */
  coAffiliations: CountedGroup[];
  /** `group_by=primary_topic.domain.id` over the window, with that request's
   *  own total (the stated denominator: the works without a topic are in no
   *  group). Added 2026-09-10; the field it feeds is optional in the stored
   *  shape so rows written before it still parse. */
  domains: { groups: CountedGroup[]; total: number };
}

const count = z.number().int().nonnegative();
const year = z.number().int();

/** A short OpenAlex institution id (`I` + digits). Stored ids become hrefs and
 *  the JSON-LD `sameAs`, so a row carrying anything else is refused whole. */
export const OPENALEX_INSTITUTION_ID_RE = /^I\d+$/;
/** An ISO 3166-1 alpha-2 country code as OpenAlex keys `authorships.countries`. */
const COUNTRY_CODE_RE = /^[A-Z]{2}$/;
const openalexInstitutionId = z.string().regex(OPENALEX_INSTITUTION_ID_RE);

/**
 * The stored shape (`Institution.openalexAggregates`). Parsed back with
 * {@link parseInstitutionAggregates} before any render: a row is external data
 * to the page, and an older or hand-edited row must degrade to "not fetched
 * yet" rather than throw or show nonsense.
 */
export const InstitutionAggregatesSchema = z.object({
  version: z.literal(1),
  countedEntity: z.object({
    openalexId: openalexInstitutionId,
    displayName: z.string(),
    lineageSize: count,
    relatedCount: count,
    foldedIds: z.array(z.string().min(1)),
    fetchedAt: z.string().min(1),
  }),
  countedWorkTypes: z.array(z.string().min(1)),
  years: z.object({ from: year, to: year }),
  worksByYear: z.array(z.object({ year, count })),
  oaByStatusByYear: z.array(z.object({ year, status: z.string().min(1), count })),
  topCountries: z.array(
    z.object({ code: z.string().regex(COUNTRY_CODE_RE), name: z.string(), count }),
  ),
  topCoAffiliations: z.array(
    z.object({ openalexId: openalexInstitutionId, name: z.string(), count }),
  ),
  /** The field mix: works by the OpenAlex domain of their primary topic over
   *  the window, in OpenAlex's own domain order (by id, so two pages line up
   *  row for row — never sorted by count), and the request's own total. OPTIONAL —
   *  a required addition would fail every stored row until its next refresh;
   *  the page shows nothing for a row without it. Counts only, so the reader
   *  can see whether two mixes are alike; never a field-normalised share. */
  domains: z
    .object({
      total: count,
      byDomain: z.array(z.object({ id: z.string().regex(/^\d+$/), name: z.string(), count })),
    })
    .optional(),
});

export type InstitutionAggregates = z.infer<typeof InstitutionAggregatesSchema>;

/** The last path segment of an OpenAlex URI (`https://openalex.org/I1` → `I1`,
 *  `…/countries/JP` → `JP`); a bare id is returned unchanged. */
export function shortOpenAlexId(idOrUri: string): string {
  const trimmed = idOrUri.trim();
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

/** The years the snapshot covers, oldest first: the last {@link FULL_YEARS_BACK}
 *  full years and the current (UTC) year. */
export function countedYears(now: Date): number[] {
  const current = now.getUTCFullYear();
  return Array.from({ length: FULL_YEARS_BACK + 1 }, (_, i) => current - FULL_YEARS_BACK + i);
}

/**
 * The OpenAlex ids whose works are counted under this organisation: the entity
 * itself, then every associated institution that is not a parent (`related`
 * hospitals and labs, `child` facilities), deduplicated and capped at
 * {@link MAX_FOLDED_IDS}. Used both as the works filter and to exclude these
 * same ids from the co-affiliation list.
 */
export function foldedInstitutionIds(entity: InstitutionEntity): string[] {
  const ids = [shortOpenAlexId(entity.openalexId)];
  for (const rel of entity.related) {
    if (rel.relationship === "parent") continue;
    const id = shortOpenAlexId(rel.id);
    if (!ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, MAX_FOLDED_IDS);
}

function byCountDesc<T extends { count: number }>(a: T, b: T): number {
  return b.count - a.count;
}

function oaStatusRank(status: string): number {
  const i = (OA_STATUS_ORDER as readonly string[]).indexOf(status);
  return i === -1 ? OA_STATUS_ORDER.length : i;
}

/**
 * Reduce the fetched entity + grouped counts to the stored aggregates. Pure:
 * `fetchedAt` is stamped into the counted-entity line (the page's "as of"),
 * `now` fixes the year window (defaults to the wall clock).
 */
export function computeInstitutionAggregates(
  entity: InstitutionEntity,
  groups: InstitutionGroupCounts,
  opts: { fetchedAt: Date; now?: Date },
): InstitutionAggregates {
  const years = countedYears(opts.now ?? new Date());
  const window = new Set(years);

  const countByYear = new Map<number, number>();
  for (const g of groups.byYear) countByYear.set(Number(g.key), g.count);
  const worksByYear = years.map((y) => ({ year: y, count: countByYear.get(y) ?? 0 }));

  const oaByStatusByYear = groups.oaByYear
    .filter((entry) => window.has(entry.year))
    .sort((a, b) => a.year - b.year)
    .flatMap((entry) =>
      [...entry.groups]
        .sort((a, b) => oaStatusRank(a.key) - oaStatusRank(b.key))
        .map((g) => ({ year: entry.year, status: g.key, count: g.count })),
    );

  const topCountries = [...groups.countries]
    .sort(byCountDesc)
    .slice(0, TOP_N)
    .map((g) => ({ code: shortOpenAlexId(g.key), name: g.label, count: g.count }));

  const own = new Set([
    ...entity.lineage.map(shortOpenAlexId),
    ...entity.related.map((r) => shortOpenAlexId(r.id)),
    shortOpenAlexId(entity.openalexId),
  ]);
  const topCoAffiliations = groups.coAffiliations
    .map((g) => ({ openalexId: shortOpenAlexId(g.key), name: g.label, count: g.count }))
    .filter((g) => !own.has(g.openalexId))
    .sort(byCountDesc)
    .slice(0, TOP_N);

  const domains = {
    total: groups.domains.total,
    byDomain: [...groups.domains.groups]
      .map((g) => ({ id: shortOpenAlexId(g.key), name: g.label, count: g.count }))
      .sort((a, b) => Number(a.id) - Number(b.id)),
  };

  return {
    version: 1,
    countedEntity: {
      openalexId: shortOpenAlexId(entity.openalexId),
      displayName: entity.displayName,
      lineageSize: entity.lineage.length,
      relatedCount: entity.related.length,
      foldedIds: foldedInstitutionIds(entity),
      fetchedAt: opts.fetchedAt.toISOString(),
    },
    countedWorkTypes: [...COUNTED_WORK_TYPES],
    years: { from: years[0]!, to: years[years.length - 1]! },
    worksByYear,
    oaByStatusByYear,
    topCountries,
    topCoAffiliations,
    domains,
  };
}

/** The stored JSON as aggregates, or null when it is not the shape above. */
export function parseInstitutionAggregates(input: unknown): InstitutionAggregates | null {
  const parsed = InstitutionAggregatesSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
