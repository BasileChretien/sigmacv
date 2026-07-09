import type { OpenAlexWork } from "./types";

/**
 * Author-level metrics DERIVED from per-work OpenAlex fields (computed at build
 * time, since the author record alone doesn't carry them). All fields optional:
 * when the underlying per-work data is absent, the aggregate is omitted rather
 * than fabricated.
 */
export interface DerivedMetrics {
  /**
   * MNCS (mean normalized citation score) computed as a RATIO OF SUMS — total
   * observed citations ÷ total field/year-EXPECTED citations — the consistent
   * author-level field normalization (Waltman et al. 2011, "Towards a new crown
   * indicator"). 1.0 = field & year average. This is the headline field-normalized
   * indicator; it does NOT suffer the "average of ratios" bias of {@link fwci_mean}.
   */
  mncs?: number;
  /** Works the MNCS spans (those carrying an FWCI + a citation count). */
  mncs_n?: number;
  /**
   * Mean of per-work FWCI — a ROUGH PROXY only. It is an "average of ratios",
   * which over-weights works in low-citation fields/years, so it is deprecated as
   * a headline (prefer {@link mncs}) and no longer offered in the metric catalog.
   * Still computed + stored for back-compat and research.
   */
  fwci_mean?: number;
  /**
   * Number of works that actually carried an FWCI value, i.e. the sample the
   * mean was computed over. OpenAlex leaves FWCI null for recent/low-data works,
   * so this is usually < total works. Surfaced next to the mean so a small-N
   * average isn't read as a precise field-normalized score (Leiden principle 7).
   */
  fwci_n?: number;
  /**
   * Fraction (0..1) of works in the top decile by PUBLICATION-YEAR citations
   * (OpenAlex `cited_by_percentile_year` ≥ 90). NOTE: year-normalized only, NOT
   * field-normalized — it reads high for most authors (most works globally are
   * barely cited), so it is stored for research but NOT offered as a metric.
   */
  top10pct_share?: number;
}

export function computeDerivedMetrics(works: OpenAlexWork[]): DerivedMetrics {
  const out: DerivedMetrics = {};

  // MNCS as a RATIO OF SUMS (the consistent crown indicator). FWCI_i = c_i / e_i,
  // so the field/year-expected citations e_i = c_i / FWCI_i (recoverable only when
  // FWCI_i > 0, i.e. the work has ≥1 citation and a field baseline). MNCS is then
  // Σ c_i ÷ Σ e_i — NEVER the mean of the per-work ratios.
  const mncsWorks = works.filter(
    (w) => typeof w.fwci === "number" && w.fwci > 0 && typeof w.cited_by_count === "number",
  );
  if (mncsWorks.length > 0) {
    const observed = mncsWorks.reduce((s, w) => s + (w.cited_by_count as number), 0);
    const expected = mncsWorks.reduce(
      (s, w) => s + (w.cited_by_count as number) / (w.fwci as number),
      0,
    );
    /* v8 ignore next -- expected > 0 whenever a work with FWCI>0 exists (FWCI>0 ⟺ cited) */
    if (expected > 0) {
      out.mncs = observed / expected;
      out.mncs_n = mncsWorks.length;
    }
  }

  const fwcis = works.map((w) => w.fwci).filter((x): x is number => typeof x === "number");
  if (fwcis.length > 0) {
    out.fwci_mean = fwcis.reduce((a, b) => a + b, 0) / fwcis.length;
    out.fwci_n = fwcis.length;
  }

  // OpenAlex returns `cited_by_percentile_year` as a {min, max} RANGE (there is
  // no `.value` field), e.g. {min: 91, max: 92}. Read the midpoint of the range,
  // falling back to `.value` if a caller supplies it. A work is "top-10%" when
  // its by-year citation percentile is ≥ 90 (year-normalized, not field-normalized).
  const percentiles = works
    .map((w) => percentileOf(w.cited_by_percentile_year))
    .filter((x): x is number => typeof x === "number");
  if (percentiles.length > 0) {
    out.top10pct_share = percentiles.filter((v) => v >= 90).length / percentiles.length;
  }

  return out;
}

/** Whether a single work sits in the top decile (by-year citation percentile ≥ 90)
 *  — year-normalized, not field-normalized. Stored per work so the (research-only)
 *  share recomputes over curated works. undefined when OpenAlex carries no
 *  percentile for the work. */
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
