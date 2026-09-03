import type { CvItem } from "@/lib/canonical/schema";

/**
 * ATTRIBUTION UNCERTAINTY — how confident are we that each work is actually the
 * account holder's?
 *
 * Every bibliometric system in common use reports author-level indicators as exact
 * integers while resting on author disambiguation that is known to be wrong. OpenAlex
 * tunes its disambiguation for RECALL over precision, so its dominant error is
 * OVER-MERGING: two real people with the same name fused into one author id. This
 * project's own published benchmark puts the namesake burden ~8x higher for
 * East-Asian-name strata (median 17 full-name namesakes vs 2 anglophone, n=469).
 *
 * "h-index 23" is therefore a claim about a work set that is itself uncertain, and
 * the uncertainty is not evenly distributed across researchers. This module is the
 * first half of taking that seriously: classifying HOW WELL EVIDENCED each work's
 * attribution is. The second half — propagating it into the indicators — lives in
 * `propagate.ts`.
 *
 * ── WHAT THIS IS NOT ──────────────────────────────────────────────────────────
 * This is NOT a calibrated probability model. v1 assigns ORDINAL classes from
 * deterministic rules over evidence the pipeline already records. The numeric
 * priors attached to those classes are PROVISIONAL and explicitly not fit to data;
 * see `PROVISIONAL_PRIORS` and the gate in `version.ts`. An interval derived from
 * chosen coefficients is a fabricated statistic — it launders a guess into the
 * visual language of a measurement — and shipping one would be the exact false
 * precision this feature exists to reject. Numeric output stays behind
 * `isCalibrated()` until the coefficients are estimated from real adjudications.
 */

/**
 * How well evidenced a work's attribution to the account holder is. Ordinal, most
 * to least confident. Deliberately coarse: the evidence the pipeline records does
 * not support finer distinctions, and pretending otherwise is the failure mode.
 */
export const ATTRIBUTION_CLASSES = [
  /** The account holder personally confirmed it, or asserted it is not theirs.
   *  Human adjudication outranks every heuristic below. */
  "adjudicated",
  /** An ORCID iD on the authorship matched the account holder, with nothing
   *  contradicting it. The strongest automatic evidence available. */
  "identified",
  /** Strong evidence with a caveat: an ORCID match that nonetheless tripped a
   *  misattribution signal, OR an OpenAlex-author-id match with none. */
  "probable",
  /** An author-id-only match that tripped ONE misattribution signal. */
  "uncertain",
  /** An author-id-only match that tripped TWO OR MORE signals — the combination
   *  `misattribution.ts` treats as a probable over-merge. */
  "doubtful",
  /** The user added this work themselves (DOI claim, manual entry, BibTeX import).
   *  Its own class because the evidence is the user's assertion, not an identifier
   *  match: it is not "uncertain", it is differently sourced, and folding it into
   *  the identifier scale would make the two incomparable. */
  "self-asserted",
] as const;

export type AttributionClass = (typeof ATTRIBUTION_CLASSES)[number];

/** Rank for ordering / comparison — 0 = most confident. */
export function attributionRank(c: AttributionClass): number {
  return ATTRIBUTION_CLASSES.indexOf(c);
}

/**
 * Classify one work's attribution evidence.
 *
 * Reads ONLY what the build pipeline already records: `meta.matchBasis` (which
 * identifier matched), `meta.misattribution` (the precision-first heuristic's
 * verdict and which signals fired), `meta.claimed` / `source`, and the user's own
 * adjudication (`reviewedAt` / `notMine`).
 *
 * Ordering matters. Human adjudication is checked first because a researcher's
 * own ruling on their own work is better evidence than any signal we compute;
 * self-assertion is checked before identifier evidence because a claimed work
 * usually has no identifier match to reason about at all.
 */
export function classifyAttribution(item: CvItem): AttributionClass {
  // A person looked at it and ruled. Both directions are adjudicated: "not mine"
  // is a rejection we should treat as certain, not as residual doubt.
  if (item.notMine || item.reviewedAt) return "adjudicated";

  // User-supplied. The evidence is an assertion, not a match.
  if (item.meta.claimed || item.source === "manual" || item.source === "bibtex") {
    return "self-asserted";
  }

  const signals = item.meta.misattribution?.signals?.length ?? 0;
  const orcidMatched = item.meta.matchBasis === "orcid" || item.meta.matchBasis === "both";

  if (orcidMatched) {
    // An ORCID iD on the authorship is near-decisive. A signal firing anyway is
    // worth recording, but it does not undo the identifier.
    return signals > 0 ? "probable" : "identified";
  }

  // Author-id-only, or a basis we did not record (older documents). Note that
  // author-id-only is the NORMAL case — ORCID appears on only a minority of
  // OpenAlex authorships — so on its own it is "probable", not a problem. What
  // moves it down the scale is corroborating signals.
  if (signals >= 2) return "doubtful";
  if (signals === 1) return "uncertain";
  return "probable";
}

/**
 * PROVISIONAL per-class attribution probabilities.
 *
 * ⚠️ THESE ARE NOT FIT TO DATA. They are ordered, plausible placeholders that let
 * the propagation machinery be written, tested and exercised offline BEFORE any
 * adjudications exist to fit against. They must never reach a user-facing number:
 * `version.ts` gates numeric output on `isCalibrated()`, which is false for v1.
 *
 * The intended replacement is the mixed-effects logistic model already registered
 * in the project's OSF pre-registration (10.17605/OSF.IO/JTGNB), whose work-level
 * false-positive outcome is exactly this quantity, with a random intercept per
 * researcher. Fitting it turns each class into an estimate with a standard error;
 * until then these are documentation of intent, not measurement.
 *
 * `adjudicated` is split at read time by {@link priorFor}, because the class covers
 * both a confirmation and a rejection.
 */
export const PROVISIONAL_PRIORS: Readonly<Record<AttributionClass, number>> = Object.freeze({
  adjudicated: 1, // overridden per-item by priorFor (rejection ⇒ 0)
  identified: 0.995,
  probable: 0.97,
  uncertain: 0.85,
  doubtful: 0.55,
  "self-asserted": 0.99,
});

/**
 * The provisional probability that a given work is genuinely the account holder's.
 *
 * Exported for the offline calibration harness and for propagation; NOT for
 * display. A rejected work is 0 and a confirmed work is 1 — those are the two
 * points we actually know, and they are what a calibration is later fit against.
 */
export function priorFor(item: CvItem): number {
  if (item.notMine) return 0;
  if (item.reviewedAt) return 1;
  return PROVISIONAL_PRIORS[classifyAttribution(item)];
}

/** Count of items per attribution class — the profile-level evidence summary. */
export function attributionProfile(items: readonly CvItem[]): Record<AttributionClass, number> {
  const out = Object.fromEntries(ATTRIBUTION_CLASSES.map((c) => [c, 0])) as Record<
    AttributionClass,
    number
  >;
  for (const it of items) out[classifyAttribution(it)] += 1;
  return out;
}
