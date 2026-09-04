import {
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { isSourceAttributed, itemReviewState } from "@/lib/canonical/review";

/**
 * PROVENANCE LEDGER — how VERIFIABLE this document is.
 *
 * Every line is a count over the entries the document actually shows (kept =
 * not hidden, not "not mine", not excluded from this view, in a visible
 * section), each with its own explicit `denominator`, so a reader can check the
 * claim behind a CV: how many entries were attributed by an identifier rather
 * than a name, how many carry a persistent identifier they can resolve, how
 * many the owner has looked at, whether a retracted work is on the page.
 *
 * THIS MEASURES THE DOCUMENT, NOT THE RESEARCHER. A CV with every line at 100%
 * says its provenance is fully traceable; it says nothing about the quality,
 * volume or impact of the work, and it MUST NEVER be folded into a score,
 * ranked, or compared across people. A low identifier share is usually a
 * property of the sources (ORCID appears on a minority of OpenAlex authorships;
 * a hand-entered CV is not a worse CV), which is exactly why each line keeps
 * its denominator instead of collapsing into one number. See the metrics
 * rationale in `render/metrics.ts` for the project's stance on aggregates.
 *
 * Pure: derives everything from the stored document, writes nothing. Computed
 * on the OWNER's stored document, not the public projection — the projection
 * strips `matchBasis`/`claimed`/`reviewFlag`/`reviewedAt` (attribution doubt the
 * owner never chose to share), so a ledger computed after it would misreport the
 * attribution and review lines. The public route therefore computes it before
 * projecting and hands it to the renderer via `RenderOpts.provenanceLedger`.
 */

/** One ledger line: `count` of `denominator`, plus the share when defined. */
export interface LedgerLine {
  count: number;
  /** The population this line is counted over — always stated, never implied. */
  denominator: number;
  /** `count / denominator` as 0..1; undefined when the denominator is 0. */
  share?: number;
}

export interface ProvenanceLedger {
  /** Entries the document shows — the base population of the attribution lines. */
  kept: number;
  // ── Attribution: how each shown entry came to be on the CV (mutually exclusive) ──
  /** Attributed by the owner's identifier (ORCID / OpenAlex author id / DOI-linked record). */
  identifierMatched: LedgerLine;
  /** Added by the owner by DOI — source metadata, owner-asserted ownership. */
  claimed: LedgerLine;
  /** Typed in or imported (.bib) by the owner — no source attribution at all. */
  selfEntered: LedgerLine;
  /** Name+organisation matches (registries / funders) the owner chose to show. */
  nameMatched: LedgerLine;
  /** Shown entries that fit none of the above (e.g. a registry match the owner
   *  confirmed after its flag was cleared). Normally 0. */
  other: LedgerLine;
  // ── Verifiability ──
  /** Positions / education / distinctions asserted on ORCID by a TRUSTED
   *  ORGANISATION (not self-entered), over the shown entries of those sections. */
  verified: LedgerLine;
  /** Entries a reader can resolve by a persistent identifier (DOI, PMID, arXiv id,
   *  ORCID put-code), over all shown entries. */
  persistentId: LedgerLine;
  /** Source-attributed publications the owner looked at and confirmed, over the
   *  source-attributed publications shown (owner-entered/claimed ones excluded —
   *  "has the owner checked them?" is vacuous there). */
  reviewed: LedgerLine;
  /** Retracted works still on the page (0 whenever `display.hideRetracted`), over
   *  the shown citation entries. */
  retractedVisible: LedgerLine;
}

/** The section types whose entries `meta.verified` can apply to. */
const VERIFIABLE_SECTIONS: ReadonlySet<CvSectionType> = new Set<CvSectionType>([
  "positions",
  "education",
  "awards",
]);

/** Sources whose items are attributed through the owner's own identifier even
 *  when the item carries no `matchBasis` (positions, roles, datasets, …). */
const IDENTIFIER_SOURCES: ReadonlySet<CvItem["source"]> = new Set<CvItem["source"]>([
  "openalex",
  "orcid",
  "oep",
  "datacite",
  "crossref",
  "openaire",
  "dblp",
]);

const ARXIV_RE = /arxiv\.org\/(abs|pdf)\/|^10\.48550\//i;

type Attribution = "identifierMatched" | "claimed" | "selfEntered" | "nameMatched" | "other";

/** How a shown entry came to be on the CV. Order matters: the owner's own
 *  assertion (typed / claimed) is checked before any source signal. */
function attributionOf(item: CvItem): Attribution {
  if (item.source === "manual" || item.source === "bibtex") return "selfEntered";
  if (item.meta.claimed === true || item.meta.matchBasis === "claimed") return "claimed";
  if (item.meta.reviewFlag === "name-matched") return "nameMatched";
  const basis = item.meta.matchBasis;
  if (basis === "orcid" || basis === "openalex-id" || basis === "both") return "identifierMatched";
  if (IDENTIFIER_SOURCES.has(item.source)) return "identifierMatched";
  return "other";
}

/** Whether a reader can resolve this entry by a persistent identifier. */
export function hasPersistentIdentifier(item: CvItem): boolean {
  if (item.meta.doi || item.meta.pmid) return true;
  const csl = item.csl;
  if (csl?.DOI) return true;
  if (ARXIV_RE.test(csl?.URL ?? "")) return true;
  // An ORCID put-code (numeric `sourceId` on an ORCID-sourced entry) resolves on
  // the owner's public ORCID record.
  return item.source === "orcid" && /^\d+$/.test(item.sourceId);
}

function line(count: number, denominator: number): LedgerLine {
  return denominator > 0
    ? { count, denominator, share: count / denominator }
    : { count, denominator };
}

/** The entries the document shows, in every visible section, with their section type. */
function shownItems(cv: CanonicalCv): Array<{ item: CvItem; type: CvSectionType }> {
  const out: Array<{ item: CvItem; type: CvSectionType }> = [];
  for (const section of cv.sections) {
    if (!section.visible) continue;
    const excluded = cv.display.excludedItems?.[section.id];
    const exSet = excluded?.length ? new Set(excluded) : null;
    for (const item of section.items) {
      if (isHidden(item) || exSet?.has(item.id)) continue;
      out.push({ item, type: section.type });
    }
  }
  return out;
}

/** Compute the provenance ledger of a document. Pure; cheap (one pass). */
export function provenanceLedger(cv: CanonicalCv): ProvenanceLedger {
  const shown = shownItems(cv);
  const kept = shown.length;
  const attribution: Record<Attribution, number> = {
    identifierMatched: 0,
    claimed: 0,
    selfEntered: 0,
    nameMatched: 0,
    other: 0,
  };
  let verifiable = 0;
  let verified = 0;
  let withPid = 0;
  let citations = 0;
  let retracted = 0;
  let attributed = 0;
  let confirmed = 0;
  const showRetracted = !cv.display.hideRetracted;
  for (const { item, type } of shown) {
    attribution[attributionOf(item)] += 1;
    if (VERIFIABLE_SECTIONS.has(type)) {
      verifiable += 1;
      if (item.meta.verified === true) verified += 1;
    }
    if (hasPersistentIdentifier(item)) withPid += 1;
    if (item.csl) {
      citations += 1;
      if (showRetracted && item.meta.retracted === true) retracted += 1;
    }
    if (isSourceAttributed(item)) {
      attributed += 1;
      if (itemReviewState(item) === "confirmed") confirmed += 1;
    }
  }
  return {
    kept,
    identifierMatched: line(attribution.identifierMatched, kept),
    claimed: line(attribution.claimed, kept),
    selfEntered: line(attribution.selfEntered, kept),
    nameMatched: line(attribution.nameMatched, kept),
    other: line(attribution.other, kept),
    verified: line(verified, verifiable),
    persistentId: line(withPid, kept),
    reviewed: line(confirmed, attributed),
    retractedVisible: line(retracted, citations),
  };
}
