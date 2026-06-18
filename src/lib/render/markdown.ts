import { isProseSectionType, type CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { wrapSelf } from "./emphasize";
import { escapeMarkdown } from "./escape";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { isSummaryBlockHidden, metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { Renderer, RenderInput, RenderResult } from "./types";

function yamlString(s: string): string {
  // Double-quoted YAML scalar. Collapse newlines / control chars to a space so a
  // multi-line value (e.g. a displayName containing "\n\n## Forged") can't break
  // out of the single-line frontmatter block, then escape backslash and the
  // quote so the scalar itself stays well-formed.
  let oneLine = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    oneLine += code < 0x20 || code === 0x7f ? " " : ch;
  }
  return `"${oneLine.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Markdown with YAML frontmatter (Hugo-compatible). Self name is bolded with
 * `**…**` on the user's own works. Prose sections render in the section flow as
 * `## <heading>` + their escaped body (heading + body are USER FREE-TEXT, so both
 * run through `escapeMarkdown` — a body of "# Not a heading" or stray `*`/`[`
 * can't change the document's block structure).
 */
export function renderCvMarkdown(cv: CanonicalCv): string {
  const sections = prepareSections(cv, "text");
  const fallbackTitle = renderStrings(cv.display.locale).cvFallbackTitle;

  const frontmatter = [
    "---",
    `title: ${yamlString(cv.owner.displayName || fallbackTitle)}`,
    cv.owner.orcid ? `orcid: ${yamlString(cv.owner.orcid)}` : null,
    `generated: ${yamlString(cv.provenance.generatedAt)}`,
    "source: openalex",
    "---",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const body = sections
    .map(({ section, items }) => {
      if (isProseSectionType(section.type)) {
        const prose = (section.body ?? "").trim();
        if (!prose) return "";
        return `## ${escapeMarkdown(section.title)}\n\n${escapeMarkdown(prose)}`;
      }
      if (items.length === 0) return "";
      const lines = items.map(({ item, entry }, i) => {
        let text = escapeMarkdown(entry);
        if (cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0) {
          text = wrapSelf(text, item.selfNameVariants.map(escapeMarkdown), (s) => `**${s}**`);
        }
        return `${i + 1}. ${text}`;
      });
      return `## ${escapeMarkdown(section.title)}\n\n${lines.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const head = textHeader(cv);
  // displayName + honorific are user free-text — escape them so a name like
  // "Doe\n\n## Forged" can't inject Markdown block structure into the export.
  const name = escapeMarkdown(cv.owner.displayName || fallbackTitle);
  const heading = head.honorific ? `${escapeMarkdown(head.honorific)} ${name}` : name;
  const headlineBlock = head.headline ? `*${escapeMarkdown(head.headline)}*\n\n` : "";
  const contactBlock = head.contact.length
    ? `${head.contact.map(escapeMarkdown).join(" · ")}\n\n`
    : "";
  const summaryBlock = head.summary ? `${escapeMarkdown(head.summary)}\n\n` : "";
  const metrics = isSummaryBlockHidden(cv) ? "" : metricsLineText(cv);
  const metricsBlock = metrics ? `*${escapeMarkdown(metrics)}*\n\n` : "";
  return `${frontmatter}\n\n# ${heading}\n\n${headlineBlock}${contactBlock}${summaryBlock}${metricsBlock}${body}\n`;
}

export const markdownRenderer: Renderer = {
  format: "markdown",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    const text = renderCvMarkdown(cv);
    return {
      format: "markdown",
      mimeType: "text/markdown; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.md`,
      text,
    };
  },
};
