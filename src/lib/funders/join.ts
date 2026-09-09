import {
  isHidden,
  itemEffectiveYear,
  itemVenue,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { openAccessState, type OpenAccessState } from "@/lib/cv/worklist";
import { bareRorId } from "@/lib/ror/id";

/**
 * The funder join — the owner's OWN grants against the funders printed on each
 * of their works. Pure; the only funder statement SigmaCV makes, and it makes
 * it to the owner alone (the editor worklist): "this work acknowledges your
 * award X from funder Y". Nothing here reaches a public surface
 * (`tests/funders-not-public.test.ts`).
 *
 * The two sides carry ids in DIFFERENT namespaces — the schema's NAMESPACE
 * CAVEAT on `meta.funders`. A grant item's `funderId` is ORCID's disambiguated
 * organisation id (`FUNDREF:…` / `ROR:…` / `GRID:…` / `RINGGOLD:…`), a bare
 * FundRef DOI (Crossref grants), or an OpenAlex `F…` URL borrowed when an
 * award number matched at build; a work's `funders[].id` is always the
 * OpenAlex `F…` URL. So a funder is compared only after BOTH resolve to a
 * short OpenAlex id through the `/funders` crosswalk ({@link FunderRow}: the
 * FundRef DOI and ROR id OpenAlex records for each funder) — never by string
 * equality — and GRID / RINGGOLD ids, which the crosswalk does not carry, count
 * as no id at all.
 *
 * Two match rules, in order, both conservative:
 *  (a) award number — the work's `funders[].awardId` equals the grant's
 *      `awardId` after normalisation (case, whitespace, hyphens, slashes only;
 *      leading zeros are kept), AND no comparable id disagrees: the grant's
 *      own FundRef DOI against the work row's, the grant's own ROR id against
 *      the work row's, and the OpenAlex id the grant carries or resolves to
 *      against the work's. Only when NEITHER side offers a comparable id does
 *      the award number decide alone — a grant whose funder sits outside the
 *      crosswalk is not thereby a grant whose funder agrees;
 *  (b) funder id — the work names the funder WITHOUT an award number and the
 *      grant's funder resolves to that same OpenAlex funder. Weaker, flagged
 *      `matchBasis: "funder-id"` so the copy says so.
 * A work whose award number did not match is never joined by its funder.
 */

/** One `Funder` crosswalk row (`prisma/schema.prisma`), ids in their bare forms. */
export interface FunderRow {
  /** Short OpenAlex funder id, `F…`. */
  openalexId: string;
  /** FundRef DOI, `10.13039/<digits>`. */
  fundrefDoi?: string;
  /** Bare ROR id. */
  rorId?: string;
  /** Wikidata item, `Q…`. */
  wikidataId?: string;
  name: string;
}

export type FundingMatchBasis = "award-number" | "funder-id";

/** One joined (work, grant) pair, with what the worklist sentence needs. */
export interface OwnerFundingJoin {
  workId: string;
  grantId: string;
  /** The grant's funder name, else the name printed on the work, else the
   *  crosswalk's; undefined when none of the three names it. */
  funderName?: string;
  /** The grant's award number as written — only on an award-number match. */
  awardId?: string;
  matchBasis: FundingMatchBasis;
  /** The FundRef DOI that keys the funder policy table, when known. */
  fundrefDoi?: string;
  title?: string;
  year?: number;
  venue?: string;
  /** What SigmaCV found, from stored fields only. */
  openAccess: OpenAccessState;
}

/** A short OpenAlex funder id, from either the URL or the bare form. */
const OPENALEX_FUNDER = /^F\d+$/i;
/** A FundRef DOI anywhere in a value (ORCID's `FUNDREF:http://dx.doi.org/…`,
 *  a doi.org URL, or the bare DOI). */
const FUNDREF_DOI = /10\.13039\/(\d+)/;
/** A ror.org path segment anywhere in a value (ORCID's `ROR:https://ror.org/…`). */
const ROR_IN_VALUE = /ror\.org\/([^\s/]+)/i;
/** Shorter award numbers are too easy to collide on ("1", "NA") to be a match. */
const MIN_AWARD_LENGTH = 3;

/** `F…` for an OpenAlex funder URL or short id; undefined for anything else. */
export function shortOpenAlexFunderId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, "");
  const short = trimmed.slice(trimmed.lastIndexOf("/") + 1);
  return OPENALEX_FUNDER.test(short) ? `F${short.slice(1)}` : undefined;
}

/** The `10.13039/…` DOI carried by a grant's funder id, in any of its forms. */
export function fundrefDoiOf(raw: string | undefined): string | undefined {
  const m = raw ? FUNDREF_DOI.exec(raw) : null;
  return m ? `10.13039/${m[1]}` : undefined;
}

function rorIdOf(raw: string | undefined): string | undefined {
  const m = raw ? ROR_IN_VALUE.exec(raw) : null;
  return m ? (bareRorId(`https://ror.org/${m[1]!.toLowerCase()}`) ?? undefined) : undefined;
}

/**
 * An award number in comparable form: upper-cased, whitespace / hyphens /
 * slashes removed — nothing else (leading zeros stay, so "0001" ≠ "1").
 * Undefined when absent or too short to be a match.
 */
export function normalizeAwardId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const normalised = raw.toUpperCase().replace(/[\s\-/]/g, "");
  return normalised.length >= MIN_AWARD_LENGTH ? normalised : undefined;
}

/** Locale-independent (code-unit) string order — deterministic on every host. */
function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The crosswalk rows keyed by short OpenAlex id (rows with another id shape dropped). */
export function toCrosswalk(rows: readonly FunderRow[]): Map<string, FunderRow> {
  const map = new Map<string, FunderRow>();
  for (const row of rows) {
    const id = shortOpenAlexFunderId(row.openalexId);
    if (id) map.set(id, row);
  }
  return map;
}

/** Every non-hidden work (citation item), in document order, all sections. */
function visibleWorks(cv: CanonicalCv): CvItem[] {
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (item.csl && !isHidden(item)) out.push(item);
    }
  }
  return out;
}

/** Every non-hidden item of the grants section(s): the owner's own grants. */
function ownGrants(cv: CanonicalCv): CvItem[] {
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    if (section.type !== "grants") continue;
    for (const item of section.items) {
      if (!isHidden(item)) out.push(item);
    }
  }
  return out;
}

/**
 * The distinct short OpenAlex funder ids printed on the owner's non-hidden
 * works, sorted — what the sync-time crosswalk writer fetches and the owner
 * page's crosswalk reader loads.
 */
export function workFunderIds(cv: CanonicalCv): string[] {
  const ids = new Set<string>();
  for (const work of visibleWorks(cv)) {
    for (const funder of work.meta.funders ?? []) {
      const id = shortOpenAlexFunderId(funder.id);
      if (id) ids.add(id);
    }
  }
  return [...ids].sort(compareCodeUnits);
}

interface CrosswalkIndex {
  byId: ReadonlyMap<string, FunderRow>;
  byFundref: Map<string, string>;
  byRor: Map<string, string>;
}

function indexCrosswalk(crosswalk: ReadonlyMap<string, FunderRow>): CrosswalkIndex {
  const byFundref = new Map<string, string>();
  const byRor = new Map<string, string>();
  for (const [id, row] of crosswalk) {
    if (row.fundrefDoi) byFundref.set(row.fundrefDoi, id);
    if (row.rorId) byRor.set(row.rorId, id);
  }
  return { byId: crosswalk, byFundref, byRor };
}

interface ResolvedFunder {
  /**
   * The short OpenAlex id the grant's funder resolves to: the `F…` it carries
   * itself, else the crosswalk row its FundRef DOI / ROR id points at.
   */
  openalexId?: string;
  /** The grant's OWN FundRef DOI — carried on the grant, never borrowed. */
  fundrefDoi?: string;
  /** The grant's OWN ROR id — carried on the grant, never borrowed. */
  rorId?: string;
}

/**
 * A grant's funder in the OpenAlex namespace, through the crosswalk only —
 * plus the comparable ids the grant carries itself, kept apart so a
 * disagreement can be seen even when the crosswalk has no row for them.
 */
function resolveGrantFunder(funderId: string | undefined, idx: CrosswalkIndex): ResolvedFunder {
  const openalexId = shortOpenAlexFunderId(funderId);
  if (openalexId) return { openalexId };
  const fundrefDoi = fundrefDoiOf(funderId);
  if (fundrefDoi) return { openalexId: idx.byFundref.get(fundrefDoi), fundrefDoi };
  const rorId = rorIdOf(funderId);
  if (rorId) return { openalexId: idx.byRor.get(rorId), rorId };
  return {};
}

interface WorkFunder {
  /** The work's OpenAlex funder id, short form (always OpenAlex-shaped here). */
  openalexId: string;
  /** Its crosswalk row, when the crosswalk has one. */
  row: FunderRow | undefined;
  award: string | undefined;
}

interface ResolvedGrant {
  item: CvItem;
  funder: ResolvedFunder;
  award: string | undefined;
}

/**
 * True when a comparable id on the grant DISAGREES with the work's funder:
 * the OpenAlex id the grant carries or resolves to, its own FundRef DOI
 * against the work row's, its own ROR id against the work row's. A side with
 * nothing comparable disagrees with nothing.
 */
function fundersDisagree(grant: ResolvedFunder, work: WorkFunder): boolean {
  if (grant.openalexId !== undefined && grant.openalexId !== work.openalexId) return true;
  if (grant.fundrefDoi && work.row?.fundrefDoi && grant.fundrefDoi !== work.row.fundrefDoi) {
    return true;
  }
  return Boolean(grant.rorId && work.row?.rorId && grant.rorId !== work.row.rorId);
}

function matchBasis(work: WorkFunder, grant: ResolvedGrant): FundingMatchBasis | undefined {
  if (work.award && grant.award) {
    if (work.award !== grant.award) return undefined;
    return fundersDisagree(grant.funder, work) ? undefined : "award-number";
  }
  if (!work.award && grant.funder.openalexId !== undefined) {
    return grant.funder.openalexId === work.openalexId ? "funder-id" : undefined;
  }
  return undefined;
}

function cslTitle(item: CvItem): string | undefined {
  const title = item.csl?.title;
  return typeof title === "string" && title.trim() ? title : undefined;
}

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * The owner's grants joined to the works that acknowledge them — one row per
 * (work, grant), the award-number basis preferred when a work names the same
 * funder more than once, ordered by (workId, grantId). Hidden grants and
 * hidden / "not mine" works never join.
 */
export function joinOwnerFunding(
  cv: CanonicalCv,
  crosswalk: ReadonlyMap<string, FunderRow>,
): OwnerFundingJoin[] {
  const grants = ownGrants(cv);
  if (grants.length === 0) return [];
  const idx = indexCrosswalk(crosswalk);
  const resolvedGrants: ResolvedGrant[] = grants.map((item) => ({
    item,
    funder: resolveGrantFunder(item.meta.funderId, idx),
    award: normalizeAwardId(item.meta.awardId),
  }));

  const out: OwnerFundingJoin[] = [];
  for (const work of visibleWorks(cv)) {
    const funders = work.meta.funders ?? [];
    if (funders.length === 0) continue;
    const byGrant = new Map<string, OwnerFundingJoin>();
    for (const printed of funders) {
      const workOpenalexId = shortOpenAlexFunderId(printed.id);
      // The shape gate that makes the namespace property hold: a work funder
      // id that is not OpenAlex-shaped (a FundRef DOI, a ROR URL, anything
      // else) is skipped outright, so a grant carrying that very string can
      // never join it by equality — only through the crosswalk, below.
      if (!workOpenalexId) continue;
      const printedFunder: WorkFunder = {
        openalexId: workOpenalexId,
        row: idx.byId.get(workOpenalexId),
        award: normalizeAwardId(printed.awardId),
      };
      for (const grant of resolvedGrants) {
        const basis = matchBasis(printedFunder, grant);
        if (!basis) continue;
        if (byGrant.get(grant.item.id)?.matchBasis === "award-number") continue;
        const row = printedFunder.row;
        byGrant.set(grant.item.id, {
          workId: work.id,
          grantId: grant.item.id,
          funderName:
            nonBlank(grant.item.meta.funderName) ?? nonBlank(printed.name) ?? nonBlank(row?.name),
          awardId: basis === "award-number" ? grant.item.meta.awardId : undefined,
          matchBasis: basis,
          // The policy key: the grant's OWN FundRef DOI when it carries one,
          // else the DOI OpenAlex records for the work's funder.
          fundrefDoi: grant.funder.fundrefDoi ?? row?.fundrefDoi,
          title: cslTitle(work),
          year: itemEffectiveYear(work),
          venue: itemVenue(work),
          openAccess: openAccessState(work),
        });
      }
    }
    out.push(...byGrant.values());
  }
  return out.sort(
    (a, b) => compareCodeUnits(a.workId, b.workId) || compareCodeUnits(a.grantId, b.grantId),
  );
}
