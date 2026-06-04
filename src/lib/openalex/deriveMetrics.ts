import type { OpenAlexWork } from "./types";

/**
 * Author-level metrics DERIVED from per-work OpenAlex fields (computed at build
 * time, since the author record alone doesn't carry them). All fields optional:
 * when the underlying per-work data is absent, the aggregate is omitted rather
 * than fabricated.
 */
export interface DerivedMetrics {
  /** Mean of per-work FWCI (a proxy — NOT OpenAlex's official author FWCI). */
  fwci_mean?: number;
  /**
   * Number of works that actually carried an FWCI value, i.e. the sample the
   * mean was computed over. OpenAlex leaves FWCI null for recent/low-data works,
   * so this is usually < total works. Surfaced next to the mean so a small-N
   * average isn't read as a precise field-normalized score (Leiden principle 7).
   */
  fwci_n?: number;
  /** Fraction (0..1) of works in the top decile by field+year citations. */
  top10pct_share?: number;
}

export function computeDerivedMetrics(works: OpenAlexWork[]): DerivedMetrics {
  const out: DerivedMetrics = {};

  const fwcis = works
    .map((w) => w.fwci)
    .filter((x): x is number => typeof x === "number");
  if (fwcis.length > 0) {
    out.fwci_mean = fwcis.reduce((a, b) => a + b, 0) / fwcis.length;
    out.fwci_n = fwcis.length;
  }

  // OpenAlex returns `cited_by_percentile_year` as a {min, max} RANGE (there is
  // no `.value` field), e.g. {min: 91, max: 92}. Read the midpoint of the range,
  // falling back to `.value` if a caller supplies it. A work is "top-10%" when
  // its citation percentile for its field+year is ≥ 90.
  const percentiles = works
    .map((w) => percentileOf(w.cited_by_percentile_year))
    .filter((x): x is number => typeof x === "number");
  if (percentiles.length > 0) {
    out.top10pct_share =
      percentiles.filter((v) => v >= 90).length / percentiles.length;
  }

  return out;
}

/** Whether a single work sits in the top decile (citation percentile ≥ 90) for
 *  its field + year — stored per work so the share recomputes over curated works.
 *  undefined when OpenAlex carries no percentile for the work. */
export function workTopDecile(work: OpenAlexWork): boolean | undefined {
  const p = percentileOf(work.cited_by_percentile_year);
  return typeof p === "number" ? p >= 90 : undefined;
}

/** Resolve a single percentile (0–100) from OpenAlex's range/value shape. */
function percentileOf(
  p: { min?: number; max?: number; value?: number } | null | undefined,
): number | undefined {
  if (!p) return undefined;
  if (typeof p.value === "number") return p.value;
  if (typeof p.min === "number" && typeof p.max === "number") {
    return (p.min + p.max) / 2;
  }
  if (typeof p.min === "number") return p.min;
  if (typeof p.max === "number") return p.max;
  return undefined;
}
