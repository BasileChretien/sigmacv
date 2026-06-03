import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Pure helpers that derive the research signals from canonical CV states.
 * No DB / consent logic here — that lives in `log.ts`.
 */

export interface CurationCorrection {
  itemId: string;
  sourceId: string;
  /** Previous `included` value. */
  from: boolean;
  /** New `included` value. A true→false flip is a "not mine" correction. */
  to: boolean;
  /** Whether the identifier match flagged this as the user's own work. */
  authoredBySelf: boolean;
  meta: {
    year?: number;
    type?: string;
    doi?: string;
  };
}

/**
 * Compare two canonical states and return items whose `included` flag flipped.
 * Items that didn't exist before (new pulls) are not corrections.
 */
export function diffIncludedChanges(
  prev: CanonicalCv | null,
  next: CanonicalCv,
): CurationCorrection[] {
  if (!prev) return [];
  const prevIncluded = new Map<string, boolean>();
  for (const s of prev.sections) {
    for (const it of s.items) prevIncluded.set(it.id, it.included);
  }

  const out: CurationCorrection[] = [];
  for (const s of next.sections) {
    for (const it of s.items) {
      const before = prevIncluded.get(it.id);
      if (before === undefined || before === it.included) continue;
      out.push({
        itemId: it.id,
        sourceId: it.sourceId,
        from: before,
        to: it.included,
        authoredBySelf: it.authoredBySelf,
        meta: {
          year: it.meta.year,
          type: it.meta.type,
          doi: it.meta.doi,
        },
      });
    }
  }
  return out;
}

export interface NotMineAssertion {
  itemId: string;
  sourceId: string;
  /** true = a false→true flip (asserted not mine); false = a retraction. */
  asserted: boolean;
  authoredBySelf: boolean;
  assertedAt?: string;
  /** The user's structured reason for the assertion (when given). */
  reason?: string;
  /** The disambiguation hint the build computed, if any (e.g. "orcid-conflict"). */
  reviewFlag?: string;
  /** How the (now-disputed) self-match was made: "orcid" | "openalex-id" | "both". */
  matchBasis?: string;
  meta: {
    year?: number;
    type?: string;
    doi?: string;
  };
}

/**
 * Compare two canonical states and return items whose `notMine` flag flipped.
 * This is the disambiguation-error signal (the identifier match was wrong) —
 * distinct from a plain display hide captured by `diffIncludedChanges`.
 */
export function diffNotMineChanges(
  prev: CanonicalCv | null,
  next: CanonicalCv,
): NotMineAssertion[] {
  if (!prev) return [];
  const prevNotMine = new Map<string, boolean>();
  for (const s of prev.sections) {
    for (const it of s.items) prevNotMine.set(it.id, it.notMine);
  }

  const out: NotMineAssertion[] = [];
  for (const s of next.sections) {
    for (const it of s.items) {
      const before = prevNotMine.get(it.id);
      if (before === undefined || before === it.notMine) continue;
      out.push({
        itemId: it.id,
        sourceId: it.sourceId,
        asserted: it.notMine,
        authoredBySelf: it.authoredBySelf,
        assertedAt: it.notMineAssertedAt,
        reason: it.notMineReason,
        reviewFlag: it.meta.reviewFlag,
        matchBasis: it.meta.matchBasis,
        meta: { year: it.meta.year, type: it.meta.type, doi: it.meta.doi },
      });
    }
  }
  return out;
}

export interface CompositionSnapshot {
  template: string;
  cslStyle: string;
  /** CV content language (a self-presentation choice in its own right). */
  locale: string;
  highlightSelf: boolean;
  showMetrics: boolean;
  /** Which metric keys the user chose to display (for the metric-norms study). */
  metricsShown: string[];
  /** Show only peer-reviewed publications (drops preprints from the main list). */
  peerReviewedOnly: boolean;
  /** Sort order applied to publications (citations / year / custom). */
  publicationOrder: string;
  /** Whether the authorship-position summary table is shown, and which roles. */
  showAuthorshipTable: boolean;
  authorshipRoles: string[];
  /** Whether the per-year publication/citation charts are shown. */
  showCharts: boolean;
  fontPairing: string;
  density: string;
  accentColor: string;
  sections: Array<{
    type: string;
    visible: boolean;
    /** Display order (a first-class self-presentation choice). */
    order: number;
    itemCount: number;
    includedCount: number;
  }>;
}

/** A privacy-conscious snapshot of self-presentation / metric-display choices. */
export function compositionSnapshot(cv: CanonicalCv): CompositionSnapshot {
  return {
    template: cv.display.template,
    cslStyle: cv.display.cslStyle,
    locale: cv.display.locale,
    highlightSelf: cv.display.highlightSelf,
    showMetrics: cv.display.showMetrics,
    metricsShown: cv.display.metrics,
    peerReviewedOnly: cv.display.peerReviewedOnly,
    publicationOrder: cv.display.publicationOrder,
    showAuthorshipTable: cv.display.showAuthorshipTable,
    authorshipRoles: cv.display.authorshipRoles,
    showCharts: cv.display.showCharts,
    fontPairing: cv.display.fontPairing,
    density: cv.display.density,
    accentColor: cv.display.accentColor,
    sections: cv.sections.map((s) => ({
      type: s.type,
      visible: s.visible,
      order: s.order,
      itemCount: s.items.length,
      includedCount: s.items.filter((i) => i.included).length,
    })),
  };
}
