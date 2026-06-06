import {
  type CanonicalCv,
  type CvNarrativeModule,
  type CvSectionType,
  type DisplayChoices,
} from "./schema";
import { setSectionVisible, updateDisplay } from "./curate";
import { defaultNarrativeModules } from "@/lib/i18n/narrative";

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Grant-CV presets (Phase 7.4 EU · 7.5 US NSF · 7.6 Japan JSPS) — one-click
 * "grant CV" starting points.
 * ───────────────────────────────────────────────────────────────────────────
 * Each preset configures the canonical CV to match the STRUCTURE that a major
 * funding call expects, reusing the existing section types + display fields.
 * These are structured STARTING POINTS, not pixel-exact official templates —
 * the funder mandates its own portal/template (ERC/MSCA via the EU Funding &
 * Tenders portal; NSF via SciENcv on Research.gov; JSPS/KAKENHI via e-Rad with
 * data maintained in researchmap), and the localized description says so
 * explicitly.
 *
 * Applying a preset only changes DISPLAY + section visibility (+ seeds the
 * narrative scaffolding). It never deletes curated item data, so it is fully
 * reversible — the editor snapshots the current view as a named preset first.
 */

export const GRANT_PRESET_IDS = ["erc", "msca", "nsf", "jsps"] as const;
export type GrantPresetId = (typeof GRANT_PRESET_IDS)[number];

/**
 * The target layout for one grant preset, expressed purely in terms of existing
 * section types + display fields. `applyGrantPreset` turns this into immutable
 * curate ops.
 */
export interface GrantPresetConfig {
  /**
   * The sections the preset wants VISIBLE, in their funder-rubric order. A
   * section already present on the CV is shown + (the array order is advisory:
   * we don't force section reordering, to keep the op minimal and reversible —
   * visibility is the load-bearing part). Sections NOT in this list are hidden.
   */
  visibleSections: readonly CvSectionType[];
  /** Display overrides applied via `updateDisplay`. */
  display: Pick<
    DisplayChoices,
    "publicationsLimit" | "publicationOrder" | "peerReviewedOnly"
  >;
  /** Whether the preset seeds + shows the narrative track-record modules. */
  includesNarrative: boolean;
}

/**
 * ERC "track record" ≈ ~10 representative outputs (Starting / Consolidator /
 * Advanced all ask for a short, curated list rather than a full bibliography).
 */
const ERC_PUBLICATIONS_LIMIT = 10;

/**
 * MSCA Postdoctoral Fellowships value a focused early-career record; a slightly
 * tighter selected-publications list keeps the CV to the expected short form.
 */
const MSCA_PUBLICATIONS_LIMIT = 8;

/**
 * NSF biographical sketch (SciENcv): the "Products" section asks for up to 5
 * products most closely related to the proposal plus up to 5 other significant
 * products — i.e. ~10 representative outputs, not a full bibliography.
 */
const NSF_PUBLICATIONS_LIMIT = 10;

/**
 * JSPS / KAKENHI researcher profile (researchmap / e-Rad): a selected
 * "research achievements" (研究業績) list rather than a complete publication
 * list keeps the profile to the expected representative form.
 */
const JSPS_PUBLICATIONS_LIMIT = 10;

/**
 * The grant-preset catalog. Every section listed maps a funder rubric item to an
 * EXISTING section type:
 *   positions → appointments · education → degrees · awards → fellowships &
 *   honours · supervision → research supervision · teaching → teaching ·
 *   service → commissions of trust / institutional responsibilities / reviewing ·
 *   editorial → editorial roles · peer-review → reviewing record ·
 *   grants → funding (ID) · talks → invited presentations ·
 *   publications → track record (selected outputs).
 */
export const GRANT_PRESETS: Record<GrantPresetId, GrantPresetConfig> = {
  // ERC (Starting / Consolidator / Advanced). A structured academic CV: track
  // record (selected, peer-reviewed), funding, fellowships/awards, supervision,
  // teaching, talks, and commissions of trust (service/editorial/peer-review).
  // Narrative track-record framing is increasingly valued — include it.
  erc: {
    visibleSections: [
      "positions",
      "education",
      "awards",
      "grants",
      "publications",
      "supervision",
      "teaching",
      "talks",
      "editorial",
      "peer-review",
      "service",
    ],
    display: {
      publicationsLimit: ERC_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
    includesNarrative: true,
  },
  // MSCA Postdoctoral Fellowships. A focused early-career CV: degrees, positions,
  // a short selected-publications list, fellowships/awards, supervision, teaching,
  // talks and reviewing/service. Narrative framing included (MSCA increasingly
  // asks for a narrative track record).
  msca: {
    visibleSections: [
      "education",
      "positions",
      "awards",
      "publications",
      "grants",
      "supervision",
      "teaching",
      "talks",
      "peer-review",
      "service",
    ],
    display: {
      publicationsLimit: MSCA_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
    includesNarrative: true,
  },
  // US NSF biographical sketch (SciENcv structure). The four NSF rubric blocks
  // map onto existing sections: Professional Preparation → education ·
  // Appointments → positions · Products → publications (≈10 selected outputs) ·
  // Synergistic Activities → service + talks. Funding (grants) is shown too.
  // NSF values a synergistic-activity narrative, so include the narrative track.
  // NOTE: the official biosketch must be generated/certified via SciENcv
  // (Research.gov); SigmaCV only drafts/maintains it (the `biosketch` Markdown
  // export reuses this NIH-style structure as a starting draft).
  nsf: {
    visibleSections: [
      "education",
      "positions",
      "publications",
      "service",
      "talks",
      "grants",
    ],
    display: {
      publicationsLimit: NSF_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
    includesNarrative: true,
  },
  // Japan JSPS / KAKENHI researcher profile (researchmap / e-Rad based). The
  // profile rubric maps onto existing sections: research achievements (研究業績)
  // → publications (≈10 selected, newest-first) · career (経歴) → positions +
  // education · research funding (研究費) → grants · awards (受賞) → awards.
  // KAKENHI increasingly asks for a narrative research summary, so include the
  // narrative track. NOTE: the application is submitted via e-Rad and the
  // researcher record is maintained in researchmap — SigmaCV produces a
  // draft/export, not the official submission.
  jsps: {
    visibleSections: [
      "publications",
      "positions",
      "education",
      "grants",
      "awards",
    ],
    display: {
      publicationsLimit: JSPS_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
    includesNarrative: true,
  },
};

/** Whether `id` is a known grant-preset id (runtime guard for untyped callers). */
export function isGrantPresetId(id: string): id is GrantPresetId {
  return (GRANT_PRESET_IDS as readonly string[]).includes(id);
}

/**
 * Seed every standard narrative module that's missing, preserving canonical
 * order. Mirrors the narrative editor's seeding: already-present modules
 * (including any the user edited) are left untouched. Pure + immutable.
 */
function seedNarrative(cv: CanonicalCv, locale: string): CanonicalCv {
  // `narrative` is `.default([])` in the schema, so it's always an array after
  // parse; the `?? []` is a defensive guard for a hand-built object.
  /* v8 ignore next -- narrative is always an array post-parse */
  const existing = cv.narrative ?? [];
  const present = new Set(existing.map((m) => m.key));
  const additions: CvNarrativeModule[] = defaultNarrativeModules(locale).filter(
    (m) => !present.has(m.key),
  );
  if (additions.length === 0) return cv;
  return { ...cv, narrative: [...existing, ...additions] };
}

/**
 * Apply a grant preset to a CV: set the funder-expected section visibility +
 * display choices, and (when the preset uses them) seed the narrative modules.
 *
 * PURE + IMMUTABLE — returns a new CV and never mutates the input. It only
 * touches DISPLAY and section visibility (and appends missing narrative
 * scaffolding); it NEVER deletes or reorders curated item data, so the change is
 * fully reversible (the caller snapshots the prior view as a named preset first).
 *
 * Unknown ids are a no-op (identity preserved).
 */
export function applyGrantPreset(
  cv: CanonicalCv,
  id: string,
  locale: string = cv.display.locale,
): CanonicalCv {
  if (!isGrantPresetId(id)) return cv;
  const config = GRANT_PRESETS[id];
  const visible = new Set<CvSectionType>(config.visibleSections);

  // Visibility: show every section the rubric wants, hide the rest. This walks
  // the existing sections only — it never creates sections (source-driven ones
  // appear on the next re-sync; the user adds the rest), keeping the op minimal.
  let next = cv;
  for (const section of cv.sections) {
    next = setSectionVisible(next, section.id, visible.has(section.type));
  }

  next = updateDisplay(next, { ...config.display });

  // Both catalog presets currently set this; the guard keeps the op correct if a
  // future preset opts out of the narrative scaffolding.
  /* v8 ignore next -- every current preset includes the narrative */
  if (config.includesNarrative) next = seedNarrative(next, locale);

  return next;
}
