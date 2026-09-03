import type { CvItem } from "@/lib/canonical/schema";
import type { Indicator } from "./propagate";

/**
 * The indicators uncertainty is propagated through.
 *
 * ⚠️ ALL OF THESE ARE CV-SCOPED. They are computed over the works on this CV, and
 * are NOT the same quantity as OpenAlex's author-level figures — which
 * `render/metrics.ts` deliberately passes through untouched, because recomputing
 * them from a possibly-partial works list would undercount. A CV-scoped h-index is
 * a statement about this document, not about the person's whole record. Anywhere
 * one of these surfaces it must be labelled accordingly; conflating the two would
 * be a subtler version of exactly the false-precision problem this module exists
 * to address.
 */

/** Works in the set. The simplest indicator, and the easiest to reason about. */
export const worksCount: Indicator = (items) => items.length;

/** Total citations across the set (works lacking a count contribute nothing). */
export const totalCitations: Indicator = (items) =>
  items.reduce((sum, it) => sum + (it.meta.citedByCount ?? 0), 0);

/**
 * h-index over the set: the largest h such that h works have >= h citations.
 * Computed here rather than read from OpenAlex precisely so uncertainty can move
 * it — a pass-through integer cannot have an interval.
 */
export const hIndex: Indicator = (items) => {
  const counts = items.map((it) => it.meta.citedByCount ?? 0).sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i]! >= i + 1) h = i + 1;
    else break;
  }
  return h;
};

/**
 * Mean NIH iCite Relative Citation Ratio over works that carry one. Field-
 * normalized but biomedical-only (PMID-keyed), matching the one field-normalized
 * measure the metric catalog actually offers. Returns 0 for an empty sample —
 * callers should read `rcrCoverage` alongside it rather than treating 0 as a score.
 */
export const rcrMean: Indicator = (items) => {
  const vals = items.map((it) => it.meta.rcr).filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

/** How many works in the set carry an RCR — the denominator behind `rcrMean`. */
export const rcrCoverage: Indicator = (items) =>
  items.filter((it) => typeof it.meta.rcr === "number").length;

/** The catalog, so a caller can propagate a named set in one pass. */
export const INDICATORS = {
  worksCount,
  totalCitations,
  hIndex,
  rcrMean,
  rcrCoverage,
} as const;

export type IndicatorKey = keyof typeof INDICATORS;
export const INDICATOR_KEYS = Object.keys(INDICATORS) as IndicatorKey[];
