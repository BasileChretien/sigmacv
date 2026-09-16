import {
  itemDisplayText,
  itemEffectiveYear,
  itemVenue,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { positionRorId, visibleCurrentPositions } from "@/lib/cv/currentPositions";
import {
  statutoryArchivingFor,
  type StatutoryArchivingEntry,
} from "@/lib/archiving/statutoryRights";
import { countableWorks } from "@/lib/render/countable";

/**
 * The OWNER worklist: what the owner can act on. Everything here is editor-only:
 * never rendered on a CV output, never on the public page, never in an export.
 * It is help, not judgement — every row carries a verb (link a position to its
 * institution, deposit a paper), and the open-access states are derived ONLY
 * from stored fields. No compliance state exists anywhere in this module, by
 * design (see the panel's vetoes) — and the i18n test enforces the wording.
 *
 * There is deliberately NO list of works "whose printed affiliation lacks your
 * institution" (removed 2026-09-16): nothing in the editor can change a work's
 * printed affiliation and nothing counts it — the institution page counts every
 * listed work of a consenting CV and the export matches by ORCID — so such a list
 * was a state with no action, and it flagged every paper published after a move
 * and every hospital ROR marks `related` rather than a child of its university.
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

export interface PositionRorRow {
  itemId: string;
  /** The institution as the CV shows it (owner rename, source name, or the line). */
  label: string;
}

export interface AffiliationGaps {
  /** Visible CURRENT positions whose ROR is unresolved (no id, junk, or foreign). */
  positionsWithoutRor: PositionRorRow[];
  /** All visible current positions (never printed as a denominator). */
  currentPositions: number;
}

function cslTitle(item: CvItem): string | undefined {
  const title = item.csl?.title;
  return typeof title === "string" && title.trim() ? title : undefined;
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
 * The owner's visible CURRENT positions whose ROR record is unresolved — the one
 * affiliation fact with a verb: the organisation, added to the position on ORCID,
 * resolves to its ROR record at the next sync (`canonical/enrich.ts`).
 */
export function affiliationGaps(cv: CanonicalCv): AffiliationGaps {
  const current = visibleCurrentPositions(cv);
  const positionsWithoutRor: PositionRorRow[] = current
    .filter((pos) => positionRorId(pos) === null)
    .map((pos) => ({ itemId: pos.id, label: positionLabel(pos) }));
  return { positionsWithoutRor, currentPositions: current.length };
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
  /** The publisher's self-archiving policy as OA.Works recorded it, stored by
   *  the owner's sync (`meta.selfArchiving`) — a dated fact, never a verdict. */
  selfArchiving?: NonNullable<CvItem["meta"]["selfArchiving"]>;
  /** The statutory entries for the countries printed on the owner's authorship
   *  (`meta.workCountries`): rules that MAY also apply, one per country. */
  statutory: StatutoryArchivingEntry[];
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
    const year = itemEffectiveYear(item);
    counts[state]++;
    rows.push({
      itemId: item.id,
      title: cslTitle(item),
      year,
      state,
      license: item.meta.license,
      venue: itemVenue(item),
      funderNames: funderNames(item),
      selfArchiving: item.meta.selfArchiving,
      // Only the rules that can cover THIS work (its year, its type): a rule the
      // data already rules out is never put in front of the owner.
      statutory: statutoryArchivingFor(item.meta.workCountries, { year, type: item.csl?.type }),
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

/** Whether the panel has anything to show: a position without a ROR, a
 *  countable work with no open copy found, a work joined to one of the owner's
 *  own grants (`funders/join.ts`), or a ROR-linked current affiliation the CV is
 *  not yet listed under (the "Institution listing" status line — an open choice
 *  to put forward, never a gap; `cv/institutionPrompt.ts` decides it). The open /
 *  not-determined works alone are not a worklist. */
export function hasWorklistContent(
  gaps: Pick<AffiliationGaps, "positionsWithoutRor">,
  readyDeposits: number,
  joinedFunding = 0,
): boolean {
  return gaps.positionsWithoutRor.length > 0 || readyDeposits > 0 || joinedFunding > 0;
}
