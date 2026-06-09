import {
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { wrapSelf } from "./emphasize";
import { escapeMarkdown } from "./escape";
import { prepareSections } from "./prepare";
import type { PreparedSection } from "./prepare";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * NIH biosketch (Markdown). A US federal, English-only form — its section
 * headings (A./B./C.) are FIXED by the NIH form and are intentionally NOT
 * translated, so this renderer adds ZERO new i18n strings. Everything else
 * (the user's data) carries through verbatim.
 *
 * Structure (NIH "Biographical Sketch", non-fellowship form):
 *   Header — name, position/headline, Education/Training list
 *   A. Personal Statement                       ← owner.summary
 *   B. Positions, Scientific Appointments, …     ← positions + awards
 *   C. Contributions to Science                  ← selected/top publications
 *
 * Publications render through `prepareSections(cv,"text")` → the SAME citeproc
 * output (and the user's `publicationsLimit`/order) as every other format, with
 * the account holder's name bolded on their own works.
 */

/** A non-citation entry's plain display string (user override, else source). */
function entryText(item: CvItem): string {
  return (itemDisplayText(item) ?? "").trim();
}

/** Bullet list of a section's visible items' display text (positions, awards,
 *  education…). Empty when the section is absent or has no displayable items. */
function bulletList(cv: CanonicalCv, type: CvSectionType): string[] {
  const section = visibleSections(cv).find((s) => s.type === type);
  if (!section) return [];
  return visibleItems(section)
    .map((it) => entryText(it))
    .filter((t) => t.length > 0)
    .map((t) => `- ${escapeMarkdown(t)}`);
}

/** The "Contributions to Science" list: every visible PUBLICATION entry, run
 *  through citeproc text and self-name-bolded — respecting `publicationsLimit`
 *  and `publicationOrder` (both already applied by `prepareSections`). */
function contributionsLines(cv: CanonicalCv, prepared: PreparedSection[]): string[] {
  const lines: string[] = [];
  for (const { section, items } of prepared) {
    if (section.type !== "publications" && section.type !== "preprints") continue;
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

export function renderCvBiosketch(cv: CanonicalCv): string {
  const owner = cv.owner;
  const prepared = prepareSections(cv, "text");

  const name = (owner.displayName || "Curriculum Vitae").trim();
  const heading = owner.honorific?.trim()
    ? `${escapeMarkdown(owner.honorific.trim())} ${escapeMarkdown(name)}`
    : escapeMarkdown(name);

  const blocks: string[] = [`# ${heading}`];

  if (owner.headline?.trim()) {
    blocks.push(`*${escapeMarkdown(owner.headline.trim())}*`);
  }

  const education = bulletList(cv, "education");
  if (education.length) {
    blocks.push(`## Education/Training\n\n${education.join("\n")}`);
  }

  // A. Personal Statement — owner.summary, or a short placeholder so the section
  // is never empty (the NIH form requires it).
  const summary = owner.summary?.trim()
    ? escapeMarkdown(owner.summary.trim())
    : "_(Add a personal statement describing your background, expertise, and the goals of this application.)_";
  blocks.push(`## A. Personal Statement\n\n${summary}`);

  // B. Positions, Scientific Appointments, and Honors — positions + awards.
  const positions = bulletList(cv, "positions");
  const awards = bulletList(cv, "awards");
  const bSection = [...positions, ...awards];
  const bBody = bSection.length ? bSection.join("\n") : "_(None listed.)_";
  blocks.push(`## B. Positions, Scientific Appointments, and Honors\n\n${bBody}`);

  // C. Contributions to Science — selected/top publications via citeproc text.
  const contributions = contributionsLines(cv, prepared);
  const cBody = contributions.length ? contributions.join("\n") : "_(None listed.)_";
  blocks.push(`## C. Contributions to Science\n\n${cBody}`);

  return `${blocks.join("\n\n")}\n`;
}

export const biosketchRenderer: Renderer = {
  format: "biosketch",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "biosketch",
      mimeType: "text/markdown; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-biosketch.md`,
      text: renderCvBiosketch(cv),
    };
  },
};
