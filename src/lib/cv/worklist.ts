import {
  isHidden,
  itemDateRange,
  itemDisplayText,
  itemEffectiveYear,
  itemVenue,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { positionRorId, visibleCurrentPositions } from "@/lib/cv/currentPositions";
import { countableWorks } from "@/lib/render/countable";
import { bareRorId } from "@/lib/ror/id";

/**
 * The OWNER worklist — the researcher-first half of reconciliation with an
 * institution's record. Everything here is editor-only: never rendered on a CV
 * output, never on the public page, never in an export (a later PR lets the
 * owner FREEZE rows deliberately). It is help, not judgement: the affiliation
 * check is strict and explainable (a work matches when its printed affiliation
 * carries a ROR id the researcher consented to — no lineage folding, which the
 * institution page does and prints), and the open-access states are derived
 * ONLY from stored fields. No compliance state exists anywhere in this module,
 * by design (see the panel's vetoes) — and the i18n test enforces the wording.
 */

// ── Affiliation gaps ─────────────────────────────────────────────────────────

/** A row that jumps to an item in the editor (the row's own id is enough: the
 *  sections list resolves the section). */
export interface WorklistRow {
  itemId: string;
  /** The CSL title; undefined when the item has none (the UI says "untitled"). */
  title?: string;
  year?: number;
}

export interface AffiliationGapRow extends WorklistRow {
  /** The affiliation(s) printed on the paper: bare ROR ids when the stored value
   *  is a ROR IRI / id, else the stored value lower-cased — so a group is always
   *  explainable even when the source carried something odd. */
  rorIds: string[];
}

export interface PositionRorRow {
  itemId: string;
  /** The institution as the CV shows it (owner rename, source name, or the line). */
  label: string;
}

export interface AffiliationGaps {
  /** Visible CURRENT positions whose ROR is unresolved (no id, junk, or foreign). */
  positionsWithoutRor: PositionRorRow[];
  /** Denominator for {@link positionsWithoutRor}: all visible current positions. */
  currentPositions: number;
  /** Works dated inside a consented position window whose printed affiliation
   *  carries NONE of the consented ids. */
  missing: AffiliationGapRow[];
  /** OpenAlex-sourced works dated inside a window with NO affiliation data
   *  (no institution on the owner's authorship, or none with a ROR id) —
   *  missing data, never a missing affiliation, so a separate bucket. */
  noAffiliationData: WorklistRow[];
  /** Denominator for the two buckets: visible OpenAlex-sourced works dated
   *  inside a window — the only works that can carry printed-affiliation data. */
  consideredWorks: number;
  /** Visible works dated inside a window from every OTHER source (datasets,
   *  conference papers, claimed DOIs, …). `workInstitutions` is written by the
   *  OpenAlex build alone, so these are never checked: a count the panel shows
   *  so the owner knows what the list left out — never a bucket, never a verdict,
   *  and not part of {@link consideredWorks}. */
  notChecked: number;
}

interface YearWindow {
  start: number;
  end: number;
}

/** A bare ROR id for a stored affiliation value when it is one, else the value
 *  itself normalised (trimmed, lower-cased) so equal strings compare equal. */
function affiliationKey(value: string): string {
  const trimmed = value.trim();
  return bareRorId(trimmed) ?? trimmed.toLowerCase();
}

/**
 * The year windows of the VISIBLE positions whose ROR id is consented — the
 * owner's date-range override replaces the source dates entirely (an absent
 * end = ongoing). A position with no start year cannot be placed on the
 * timeline and contributes no window: the list stays explainable ("dated
 * during a position you are listed under") rather than covering all time.
 */
function consentedWindows(cv: CanonicalCv, consented: ReadonlySet<string>): YearWindow[] {
  const section = visibleSections(cv).find((s) => s.type === "positions");
  if (!section) return [];
  const out: YearWindow[] = [];
  for (const pos of visibleItems(section)) {
    const rorId = positionRorId(pos);
    if (!rorId || !consented.has(rorId)) continue;
    const { startYear, endYear } = itemDateRange(pos);
    if (startYear === undefined) continue;
    out.push({ start: startYear, end: endYear ?? Number.POSITIVE_INFINITY });
  }
  return out;
}

function inAnyWindow(year: number, windows: readonly YearWindow[]): boolean {
  return windows.some((w) => year >= w.start && year <= w.end);
}

function cslTitle(item: CvItem): string | undefined {
  const title = item.csl?.title;
  return typeof title === "string" && title.trim() ? title : undefined;
}

/** Every visible work (citation item) in document order — preprints included:
 *  the affiliation printed on a paper is about the paper, not the figures.
 *  Every source is swept; the caller splits OpenAlex works (checkable) from
 *  the rest (counted only). */
function visibleWorks(cv: CanonicalCv): CvItem[] {
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (item.csl && !isHidden(item)) out.push(item);
    }
  }
  return out;
}

function positionLabel(pos: CvItem): string {
  return (
    pos.meta.institutionOverride?.trim() ||
    pos.meta.institution?.trim() ||
    itemDisplayText(pos)?.trim() ||
    ""
  );
}

/**
 * Affiliation gaps against the ROR ids the researcher consented to (the
 * institution-page consent, `Cv.consentedRorIds` — bare ids). A work matches
 * when its printed affiliation (`meta.workInstitutions`, the account holder's
 * own authorship as OpenAlex indexes it) carries ANY consented id; a stored
 * IRI (`https://ror.org/<id>`) and a bare id compare equal. Only OpenAlex-
 * sourced works are checked — `workInstitutions` exists for no other source —
 * the rest are counted as {@link AffiliationGaps.notChecked}. With no consented
 * id there is no window, so both work buckets are empty; the positions check
 * does not depend on consent.
 */
export function affiliationGaps(
  cv: CanonicalCv,
  consentedRorIds: readonly string[],
): AffiliationGaps {
  const current = visibleCurrentPositions(cv);
  const positionsWithoutRor: PositionRorRow[] = current
    .filter((pos) => positionRorId(pos) === null)
    .map((pos) => ({ itemId: pos.id, label: positionLabel(pos) }));

  const consented = new Set(consentedRorIds.map(affiliationKey));
  const windows = consentedWindows(cv, consented);
  const missing: AffiliationGapRow[] = [];
  const noAffiliationData: WorklistRow[] = [];
  let consideredWorks = 0;
  let notChecked = 0;
  if (windows.length > 0) {
    for (const item of visibleWorks(cv)) {
      const year = itemEffectiveYear(item);
      if (year === undefined || !inAnyWindow(year, windows)) continue;
      // Only the OpenAlex build writes `workInstitutions` (and only for the
      // owner's own authorship): a dataset, a conference paper or a claimed DOI
      // can never carry it, so it is counted, not bucketed as missing data.
      if (item.source !== "openalex") {
        notChecked++;
        continue;
      }
      consideredWorks++;
      const row: WorklistRow = { itemId: item.id, title: cslTitle(item), year };
      const rorIds = [...new Set((item.meta.workInstitutions ?? []).map(affiliationKey))];
      if (rorIds.length === 0) noAffiliationData.push(row);
      else if (!rorIds.some((r) => consented.has(r))) missing.push({ ...row, rorIds });
    }
  }
  return {
    positionsWithoutRor,
    currentPositions: current.length,
    missing,
    noAffiliationData,
    consideredWorks,
    notChecked,
  };
}

export interface RorGroup<Row extends { rorIds: string[] }> {
  rorId: string;
  rows: Row[];
}

/** Gap rows grouped under EACH affiliation they carry (a work with two prints
 *  appears under both), largest group first, then by id — so the owner reads
 *  "these N works printed X" rather than one flat list. */
export function groupByRor<Row extends { rorIds: string[] }>(
  rows: readonly Row[],
): RorGroup<Row>[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    for (const rorId of row.rorIds) {
      const list = groups.get(rorId) ?? [];
      list.push(row);
      groups.set(rorId, list);
    }
  }
  return [...groups.entries()]
    .map(([rorId, list]) => ({ rorId, rows: list }))
    .sort((a, b) => b.rows.length - a.rows.length || a.rorId.localeCompare(b.rorId));
}

// ── Open-access states ───────────────────────────────────────────────────────

/**
 * The four open-access states derivable from stored fields today. Deliberately
 * NOT a route, a mandate or a verdict: "no open copy found" is what open data
 * knows; whether a deposit is possible is the journal's policy (linked), and
 * whether a funder expects one is a later, identifier-matched funder join.
 */
export const OPEN_ACCESS_STATES = [
  "open-cc",
  "open-other",
  "no-open-copy-found",
  "not-determined",
] as const;
export type OpenAccessState = (typeof OPEN_ACCESS_STATES)[number];

/** `oaIsOpen === true` + a Creative Commons licence → `open-cc`; open with any
 *  other / no licence → `open-other`; `oaIsOpen === false` → `no-open-copy-found`;
 *  no determination stored → `not-determined`. */
export function openAccessState(item: Pick<CvItem, "meta">): OpenAccessState {
  const open = item.meta.oaIsOpen;
  if (open === undefined) return "not-determined";
  if (!open) return "no-open-copy-found";
  const licence = item.meta.license?.trim().toLowerCase() ?? "";
  return licence.startsWith("cc") ? "open-cc" : "open-other";
}

export interface OpenAccessRow extends WorklistRow {
  state: OpenAccessState;
  /** The stored reuse licence slug, when any. */
  license?: string;
  /** The effective journal / container name (owner override first). */
  venue?: string;
  /** The funder NAMES printed on the work (`meta.funders`), as context only —
   *  no mandate, no route, nothing that says a policy applies. */
  funderNames: string[];
}

export interface OpenAccessStates {
  /** One row per countable work, in document order. */
  rows: OpenAccessRow[];
  counts: Record<OpenAccessState, number>;
  /** The denominator: the countable works (retracted, hidden, preprints and
   *  non-peer-reviewed items excluded — the same set the figures use). */
  total: number;
}

function funderNames(item: CvItem): string[] {
  const names = (item.meta.funders ?? [])
    .map((f) => f.name?.trim())
    .filter((n): n is string => !!n);
  return [...new Set(names)];
}

/** The open-access state of every countable work (`countableWorks`), with the
 *  per-state counts over that same denominator. */
export function openAccessStates(cv: CanonicalCv): OpenAccessStates {
  const counts: Record<OpenAccessState, number> = {
    "open-cc": 0,
    "open-other": 0,
    "no-open-copy-found": 0,
    "not-determined": 0,
  };
  const rows: OpenAccessRow[] = [];
  for (const item of countableWorks(cv)) {
    const state = openAccessState(item);
    counts[state]++;
    rows.push({
      itemId: item.id,
      title: cslTitle(item),
      year: itemEffectiveYear(item),
      state,
      license: item.meta.license,
      venue: itemVenue(item),
      funderNames: funderNames(item),
    });
  }
  return { rows, counts, total: rows.length };
}

// ── Policy finder ────────────────────────────────────────────────────────────

/** Open Policy Finder (Jisc; formerly SHERPA RoMEO) — the journal's
 *  self-archiving policy, looked up by NAME: no ISSN is stored on citation
 *  items, so a name search is the best link the data allows. */
export const OPEN_POLICY_FINDER_URL = "https://openpolicyfinder.jisc.ac.uk/";

/**
 * A link to Open Policy Finder for a journal name, or undefined without one.
 *
 * The site's search-page URL pattern could not be verified from this
 * environment (the site refuses automated fetches), so the link deliberately
 * targets the SITE ROOT with the name in a `q` parameter rather than guessing
 * a `/search…` path that might 404: a wrong deep link is worse than the home
 * page with the name pre-filled in the address bar. Revisit once the pattern
 * is confirmed against the live site.
 */
export function policyFinderUrl(journalName: string | undefined): string | undefined {
  const name = journalName?.trim();
  if (!name) return undefined;
  return `${OPEN_POLICY_FINDER_URL}?q=${encodeURIComponent(name)}`;
}

// ── Panel gate ───────────────────────────────────────────────────────────────

/** Whether the panel has anything to show: a position without a ROR, a work in
 *  either affiliation bucket, a countable work with no open copy found, or a
 *  work joined to one of the owner's own grants (`funders/join.ts`). The
 *  open / not-determined works alone are not a worklist, and neither is the
 *  count of works the list does not check. */
export function hasWorklistContent(
  gaps: Pick<AffiliationGaps, "positionsWithoutRor" | "missing" | "noAffiliationData">,
  oa: Pick<OpenAccessStates, "counts">,
  joinedFunding = 0,
): boolean {
  return (
    gaps.positionsWithoutRor.length > 0 ||
    gaps.missing.length > 0 ||
    gaps.noAffiliationData.length > 0 ||
    oa.counts["no-open-copy-found"] > 0 ||
    joinedFunding > 0
  );
}
