import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { isHidden } from "@/lib/canonical/schema";
import {
  type AttributionClass,
  attributionProfile,
  attributionRank,
  classifyAttribution,
} from "./attribution";
import { INDICATORS, type IndicatorKey } from "./indicators";
import { propagate, type PropagatedIndicator, type PropagateOptions } from "./propagate";
import { CURRENT_MODEL, isCalibrated } from "./version";

/**
 * The profile-level view of attribution uncertainty — and the boundary between
 * what may be shown today and what may not.
 *
 * {@link attributionSummary} is ORDINAL and shippable now: it counts how much of a
 * profile rests on weak evidence, which is a fact about recorded evidence, not a
 * derived statistic. {@link propagateIndicators} produces NUMERIC intervals and is
 * gated: with an uncalibrated model its results are for offline research and the
 * calibration harness only, never for display. `version.ts` explains why.
 */

/** Which works attribution uncertainty is even a question about. */
function attributableItems(cv: CanonicalCv): CvItem[] {
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (item.csl) out.push(item);
    }
  }
  return out;
}

export interface AttributionSummary {
  /** Citation items in the profile (the population attribution applies to). */
  total: number;
  /** Count per evidence class. */
  byClass: Record<AttributionClass, number>;
  /** Works resting on the two weakest identifier classes — the honest headline. */
  weaklyEvidenced: number;
  /** Works the account holder has personally ruled on, either way. */
  adjudicated: number;
  /**
   * The weakest class present, or undefined for an empty profile. Lets a caller
   * phrase one sentence about a profile without inspecting every bucket.
   */
  weakest?: AttributionClass;
  /** Model that produced the classification (reproducibility stamp). */
  modelId: string;
  modelVersion: number;
  /** False ⇒ ordinal statements only; no numeric interval may be displayed. */
  calibrated: boolean;
}

/**
 * Summarise how well evidenced a profile's attributions are.
 *
 * Counts HIDDEN and "not mine" works too: they are part of what the sources
 * attributed to this person, and excluding them would flatter the summary exactly
 * when a user had found real misattributions.
 */
export function attributionSummary(cv: CanonicalCv): AttributionSummary {
  const items = attributableItems(cv);
  const byClass = attributionProfile(items);
  const present = items.map(classifyAttribution);
  const weakest = present.length
    ? present.reduce((a, b) => (attributionRank(b) > attributionRank(a) ? b : a))
    : undefined;
  return {
    total: items.length,
    byClass,
    weaklyEvidenced: byClass.uncertain + byClass.doubtful,
    adjudicated: byClass.adjudicated,
    ...(weakest ? { weakest } : {}),
    modelId: CURRENT_MODEL.id,
    modelVersion: CURRENT_MODEL.version,
    calibrated: isCalibrated(),
  };
}

/**
 * Propagate uncertainty through every named indicator over the profile's VISIBLE
 * works (what the CV actually asserts).
 *
 * ⚠️ NOT FOR DISPLAY while `calibrated` is false on the results. Intended for the
 * offline calibration harness and for research runs, where a provisional prior is
 * a legitimate starting point. Each result carries its own `calibrated` flag so a
 * consumer cannot obtain an interval without also obtaining that warning.
 */
export function propagateIndicators(
  cv: CanonicalCv,
  opts: PropagateOptions = {},
): Record<IndicatorKey, PropagatedIndicator> {
  const visible = attributableItems(cv).filter((it) => !isHidden(it));
  const out = {} as Record<IndicatorKey, PropagatedIndicator>;
  for (const [key, fn] of Object.entries(INDICATORS)) {
    out[key as IndicatorKey] = propagate(visible, fn, opts);
  }
  return out;
}
