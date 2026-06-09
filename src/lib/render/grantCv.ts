import {
  isProseSectionType,
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { GRANT_PRESETS, type GrantPresetId } from "@/lib/canonical/cvModels";
import { wrapSelf } from "./emphasize";
import { escapeMarkdown } from "./escape";
import { prepareSections } from "./prepare";
import type { PreparedSection } from "./prepare";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Funder grant-CV export (Markdown).
 * ───────────────────────────────────────────────────────────────────────────
 * Produces a STRUCTURED Markdown draft that mirrors a major funder's required
 * CV structure: the funder's own section order, its own standard headings, a
 * selected track-record / publications list (capped to the preset's
 * `publicationsLimit`) and — where the funder values it — the researcher's
 * narrative track-record modules.
 *
 * It is a DRAFT a researcher edits and pastes into the funder's own portal
 * (SciENcv / Research.gov, EU Funding & Tenders, e-Rad / researchmap), NOT the
 * official funder PDF. The structure is driven ENTIRELY off `GRANT_PRESETS`
 * (the Phase 7.4–7.6 catalog) so the export and the in-app preset stay in
 * lock-step: visible sections, their order, the publications limit and the
 * narrative flag all come from the preset.
 *
 * ── i18n policy (deliberate) ───────────────────────────────────────────────
 * The FUNDER section headings ("Professional Preparation", "Track Record",
 * "研究業績 / Publications", …) are funder-form PROPER NOUNS — the exact wording
 * the rubric uses. They are FIXED strings (English for ERC/MSCA/NSF; bilingual
 * JA+EN for JSPS), NOT routed through the ten-locale i18n: a researcher applying
 * to the ERC needs the ERC's English headings whatever their UI locale, exactly
 * as the NIH `biosketch` renderer keeps its A./B./C. headings fixed. This adds
 * ZERO new ten-locale i18n keys.
 *
 * The NARRATIVE contribution headings DO carry the user's own section title
 * (the prose `narrative-*` sections, localized via `SECTION_TITLES` when created
 * and freely renamable), because those are the researcher's own prose sections,
 * not funder-mandated proper nouns.
 */

/**
 * The per-funder heading map: for each section type a preset can make visible,
 * the funder's own standard heading. A funder only needs entries for the
 * sections its preset lists; a section without a mapping is skipped (defensive —
 * every section in each preset's `visibleSections` has an entry below).
 *
 * `publications` is special: it is the funder's track-record / products block,
 * rendered as a numbered citeproc list (≤ the preset limit), not a bullet list.
 */
type FunderHeadings = Partial<Record<CvSectionType, string>>;

const FUNDER_HEADINGS: Record<GrantPresetId, FunderHeadings> = {
  // ERC structured academic CV. Headings follow the ERC CV rubric wording.
  erc: {
    education: "Education",
    positions: "Positions",
    awards: "Fellowships and Awards",
    grants: "Funding",
    supervision: "Supervision",
    teaching: "Teaching",
    talks: "Invited Presentations",
    editorial: "Editorial Roles",
    "peer-review": "Peer Review",
    service: "Institutional Responsibilities and Commissions of Trust",
    publications: "Track Record",
  },
  // MSCA Postdoctoral Fellowships — a sensible MSCA structure over the same
  // sections (degrees → publications → record).
  msca: {
    education: "Education",
    positions: "Positions Held",
    awards: "Fellowships and Awards",
    grants: "Funding",
    supervision: "Supervision and Mentoring",
    teaching: "Teaching",
    talks: "Invited Presentations",
    "peer-review": "Peer Review",
    service: "Commissions of Trust",
    publications: "Selected Publications",
  },
  // US NSF biographical sketch (SciENcv structure): the four NSF rubric blocks.
  // service + talks both fall under "Synergistic Activities" — they are merged
  // there (talks is not given its own heading) so the NSF rubric is honoured.
  nsf: {
    education: "Professional Preparation",
    positions: "Appointments",
    publications: "Products",
    service: "Synergistic Activities",
    talks: "Synergistic Activities",
    grants: "Funding",
  },
  // Japan JSPS / KAKENHI — bilingual JA / EN headings.
  jsps: {
    publications: "研究業績 / Publications",
    positions: "経歴 / Career",
    education: "学歴 / Education",
    grants: "研究費 / Research Funding",
    awards: "受賞 / Awards",
  },
};

/**
 * A one-line footer pointing the researcher at the funder's own portal. The
 * portal phrase reuses the same wording as the localized preset captions in
 * `i18n/grantPresets.ts`, kept here as a fixed English string (it sits next to
 * the funder proper-noun headings, which are also fixed).
 */
const FUNDER_PORTAL: Record<GrantPresetId, string> = {
  erc: "the ERC's own template on the EU Funding & Tenders portal",
  msca: "the MSCA template on the EU Funding & Tenders portal",
  nsf: "SciENcv on Research.gov",
  jsps: "e-Rad (researcher record maintained in researchmap)",
};

/** A non-citation entry's plain display string (user override, else source). */
function entryText(item: CvItem): string {
  return (itemDisplayText(item) ?? "").trim();
}

/** Bullet list of a section's visible items' display text. Empty when the
 *  section is absent on the CV or has no displayable items. */
function bulletList(cv: CanonicalCv, type: CvSectionType): string[] {
  const section = visibleSections(cv).find((s) => s.type === type);
  if (!section) return [];
  return visibleItems(section)
    .map((it) => entryText(it))
    .filter((t) => t.length > 0)
    .map((t) => `- ${escapeMarkdown(t)}`);
}

/** The track-record / products list: every visible PUBLICATION entry, run
 *  through citeproc text and self-name-bolded — already capped to the preset's
 *  `publicationsLimit` and ordered by `prepareSections`. */
function publicationLines(cv: CanonicalCv, prepared: PreparedSection[]): string[] {
  const lines: string[] = [];
  for (const { section, items } of prepared) {
    if (section.type !== "publications") continue;
    for (const { item, entry } of items) {
      if (!item.csl) continue;
      let text = escapeMarkdown(entry);
      if (cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0) {
        text = wrapSelf(text, item.selfNameVariants.map(escapeMarkdown), (s) => `**${s}**`);
      }
      lines.push(`${lines.length + 1}. ${text}`);
    }
  }
  return lines;
}

/** The narrative-CV block: each VISIBLE prose section (the `narrative-*`
 *  contributions + any `statement`) with a non-empty body becomes
 *  `## <section title>` + its body. The section title + body are USER FREE-TEXT,
 *  so both run through `escapeMarkdown` so stray Markdown structure (a leading
 *  `#`, `*`, `[`) can't change the document. Empty array when nothing to show. */
function narrativeBlocks(cv: CanonicalCv): string[] {
  return visibleSections(cv)
    .filter((s) => isProseSectionType(s.type) && (s.body ?? "").trim().length > 0)
    .map((s) => `## ${escapeMarkdown(s.title)}\n\n${escapeMarkdown((s.body ?? "").trim())}`);
}

/**
 * Render a CV as a funder-structured Markdown draft for `funderId`.
 *
 * PURE — derives entirely from the canonical object + `GRANT_PRESETS[funderId]`.
 * Structure: header → narrative (if the preset uses it and the user wrote any)
 * → each preset-visible section under the funder's own heading, in the preset's
 * configured order → a portal footer note.
 */
export function renderGrantCv(cv: CanonicalCv, funderId: GrantPresetId): string {
  const preset = GRANT_PRESETS[funderId];
  const headings = FUNDER_HEADINGS[funderId];
  const owner = cv.owner;

  // The publications list goes through the SAME citeproc text + ordering + the
  // preset's `publicationsLimit` as every other format. Apply the preset's
  // display choices (limit / order / peer-reviewed-only) for THIS render so the
  // export matches what the in-app preset would show.
  const cvForRender: CanonicalCv = {
    ...cv,
    display: { ...cv.display, ...preset.display },
  };
  const prepared = prepareSections(cvForRender, "text");

  // ── Header ────────────────────────────────────────────────────────────────
  const name = (owner.displayName || "Curriculum Vitae").trim();
  const heading = owner.honorific?.trim()
    ? `${escapeMarkdown(owner.honorific.trim())} ${escapeMarkdown(name)}`
    : escapeMarkdown(name);
  const blocks: string[] = [`# ${heading}`];
  if (owner.headline?.trim()) {
    blocks.push(`*${escapeMarkdown(owner.headline.trim())}*`);
  }

  // ── Narrative contribution sections (the funders that value a narrative track
  // record). These are PROSE sections now — rendered with the user's own section
  // titles, separately from the funder-data sections below. `narrativeBlocks`
  // self-gates on the visible prose sections, so it's safe to always call.
  blocks.push(...narrativeBlocks(cvForRender));

  // ── Funder sections, in the preset's configured order ───────────────────────
  // Merge sections that share a heading (NSF: service + talks → "Synergistic
  // Activities") under a single heading, keeping the preset order of first
  // appearance. We track the EXACT block index each emitted funder heading went
  // to (heading → index) rather than re-scanning `blocks` by prefix — a user
  // narrative block whose heading happens to equal a funder heading must never
  // be mistaken for the section to append to.
  const headingBlockIndex = new Map<string, number>();
  for (const type of preset.visibleSections) {
    // Prose sections (the `narrative-*` contributions) are rendered above by
    // `narrativeBlocks` with the user's own titles, not as funder-data sections.
    if (isProseSectionType(type)) continue;
    const funderHeading = headings[type];
    /* v8 ignore next -- every non-prose preset-visible section has a heading mapping */
    if (!funderHeading) continue;

    if (type === "publications") {
      const lines = publicationLines(cvForRender, prepared);
      const body = lines.length ? lines.join("\n") : "_(None listed.)_";
      headingBlockIndex.set(funderHeading, blocks.length);
      blocks.push(`## ${funderHeading}\n\n${body}`);
      continue;
    }

    const bullets = bulletList(cvForRender, type);
    if (bullets.length === 0) continue; // omit an empty non-publications section

    const existingIdx = headingBlockIndex.get(funderHeading);
    if (existingIdx !== undefined) {
      // Same heading already emitted (e.g. NSF talks after service): append the
      // bullets to THAT specific block (tracked index), never a look-alike.
      blocks[existingIdx] = `${blocks[existingIdx]}\n${bullets.join("\n")}`;
      continue;
    }
    headingBlockIndex.set(funderHeading, blocks.length);
    blocks.push(`## ${funderHeading}\n\n${bullets.join("\n")}`);
  }

  // ── Footer: this is a SigmaCV draft; submit via the funder's own portal ──────
  blocks.push(
    `---\n\n_This is a SigmaCV draft. The final submission is made through ${FUNDER_PORTAL[funderId]}._`,
  );

  return `${blocks.join("\n\n")}\n`;
}

/**
 * Build a thin `Renderer` for one funder. Each is identical except for the
 * preset id, and all emit Markdown (`<slug>-<funder>-cv.md`). `format` doubles
 * as the funder id, which is a `GrantPresetId`, so it drives `renderGrantCv`.
 */
function grantRenderer(funderId: GrantPresetId): Renderer {
  return {
    format: funderId,
    async render({ cv }: RenderInput): Promise<RenderResult> {
      return {
        format: funderId,
        mimeType: "text/markdown; charset=utf-8",
        filename: `${cvSlug(cv.owner.displayName)}-${funderId}-cv.md`,
        text: renderGrantCv(cv, funderId),
      };
    },
  };
}

export const ercRenderer: Renderer = grantRenderer("erc");
export const mscaRenderer: Renderer = grantRenderer("msca");
export const nsfRenderer: Renderer = grantRenderer("nsf");
export const jspsRenderer: Renderer = grantRenderer("jsps");
