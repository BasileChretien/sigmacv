import {
  DEFAULT_SECTION_ORDER,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
  type DisplayChoices,
} from "./schema";
import { setSectionVisible, updateDisplay } from "./curate";
import { sectionTitle } from "@/lib/i18n";

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
 * Applying a preset:
 *  - ensures every section the funder wants EXISTS (creating any missing one as
 *    an empty section — including the `narrative-*` contribution prose sections);
 *  - sets exactly those sections VISIBLE and hides the rest;
 *  - sets the section ORDER to the preset's funder-rubric sequence;
 *  - applies the display overrides (publications limit / order / peer-reviewed).
 * It never deletes curated item data, so it is fully reversible — the editor
 * snapshots the current view as a named preset first.
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
   * The sections the preset wants VISIBLE, in their funder-rubric ORDER. Each is
   * created (empty) if absent, set visible, and ordered by its position in this
   * array; every section NOT in this list is hidden. May include the `narrative-*`
   * prose contribution sections for funders that value a narrative track record.
   */
  visibleSections: readonly CvSectionType[];
  /** Display overrides applied via `updateDisplay`. */
  display: Pick<
    DisplayChoices,
    "publicationsLimit" | "publicationOrder" | "peerReviewedOnly"
  >;
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
 *   publications → track record (selected outputs) ·
 *   narrative-* → the funder narrative track-record contribution sections.
 */
export const GRANT_PRESETS: Record<GrantPresetId, GrantPresetConfig> = {
  // ERC (Starting / Consolidator / Advanced). A structured academic CV: track
  // record (selected, peer-reviewed), funding, fellowships/awards, supervision,
  // teaching, talks, and commissions of trust (service/editorial/peer-review).
  // Narrative track-record framing is increasingly valued — include the four
  // contribution sections.
  erc: {
    visibleSections: [
      "positions",
      "education",
      "awards",
      "grants",
      "publications",
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
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
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
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
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
      "service",
      "talks",
      "grants",
    ],
    display: {
      publicationsLimit: NSF_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
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
      "narrative-knowledge",
      "narrative-individuals",
      "narrative-community",
      "narrative-society",
    ],
    display: {
      publicationsLimit: JSPS_PUBLICATIONS_LIMIT,
      publicationOrder: "year-desc",
      peerReviewedOnly: true,
    },
  },
};

/** Whether `id` is a known grant-preset id (runtime guard for untyped callers). */
export function isGrantPresetId(id: string): id is GrantPresetId {
  return (GRANT_PRESET_IDS as readonly string[]).includes(id);
}

/**
 * Create an empty section of `type` if the CV doesn't already have one, with a
 * localized title. Prose types (`narrative-*`) get an empty `body`. Pure: returns
 * a new CV (or the same one when the section already exists). Used by
 * `applyGrantPreset` to materialize the funder's narrative contribution sections.
 */
function ensureSection(cv: CanonicalCv, type: CvSectionType): CanonicalCv {
  if (cv.sections.some((s) => s.type === type)) return cv;
  const newSection: CvSection = {
    id: type,
    type,
    title: sectionTitle(cv.display.locale, type),
    visible: true,
    order: DEFAULT_SECTION_ORDER[type],
    items: [],
    ...(isProseSectionType(type) ? { body: "" } : {}),
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/**
 * Apply a grant preset to a CV:
 *  - ensure every section the funder rubric wants exists (creating any missing
 *    one — including the `narrative-*` contribution prose sections — as empty);
 *  - set those sections VISIBLE and hide every other section;
 *  - order the visible sections in the preset's funder-rubric sequence, with all
 *    other (hidden) sections kept after them in their existing relative order;
 *  - apply the display overrides (limit / order / peer-reviewed-only).
 *
 * PURE + IMMUTABLE — returns a new CV and never mutates the input. It only
 * touches DISPLAY, section visibility + order, and creates empty sections; it
 * NEVER deletes or reorders curated ITEM data, so the change is fully reversible
 * (the caller snapshots the prior view as a named preset first).
 *
 * Unknown ids are a no-op (identity preserved).
 */
export function applyGrantPreset(
  cv: CanonicalCv,
  id: string,
  /* locale kept in the signature for call-site compatibility; section titles are
     localized via `cv.display.locale` when created. */
  _locale: string = cv.display.locale,
): CanonicalCv {
  if (!isGrantPresetId(id)) return cv;
  void _locale;
  const config = GRANT_PRESETS[id];
  const wanted = config.visibleSections;
  const wantedSet = new Set<CvSectionType>(wanted);

  // 1. Materialize every wanted section that's missing (empty).
  let next = cv;
  for (const type of wanted) next = ensureSection(next, type);

  // 2. Visibility: show every wanted section, hide the rest.
  for (const section of next.sections) {
    next = setSectionVisible(next, section.id, wantedSet.has(section.type));
  }

  // 3. Order: the wanted sections take the preset's sequence (0..n-1); every
  //    other section keeps its relative order, appended after them. Operates on
  //    section TYPE → rank since a preset is expressed in types.
  const rankByType = new Map<CvSectionType, number>(
    wanted.map((type, i) => [type, i]),
  );
  const visibleCount = wanted.length;
  // Stable: hidden sections keep their existing relative order after the visible
  // block (sort by their current order, then assign sequential ranks).
  const hiddenSorted = [...next.sections]
    .filter((s) => !wantedSet.has(s.type))
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);
  const hiddenRank = new Map<string, number>(
    hiddenSorted.map((sectionId, i) => [sectionId, visibleCount + i]),
  );
  const ordered: CvSection[] = next.sections.map((s) => ({
    ...s,
    order: wantedSet.has(s.type)
      ? rankByType.get(s.type)!
      : hiddenRank.get(s.id)!,
  }));
  next = {
    ...next,
    sections: ordered,
    display: { ...next.display, sectionsCustomized: true },
  };

  // 4. Display overrides (publications limit / order / peer-reviewed-only).
  next = updateDisplay(next, { ...config.display });

  return next;
}
