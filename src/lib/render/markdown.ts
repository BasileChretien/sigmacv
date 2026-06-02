import type { CanonicalCv } from "@/lib/canonical/schema";
import { wrapSelf } from "./emphasize";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { Renderer, RenderInput, RenderResult } from "./types";

/** Light escaping so citeproc text doesn't trigger accidental Markdown formatting. */
function escapeMarkdown(s: string): string {
  return s.replace(/([\\`*_])/g, "\\$1");
}

function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Markdown with YAML frontmatter (Hugo-compatible). Self name is bolded with
 * `**…**` on the user's own works.
 */
export function renderCvMarkdown(cv: CanonicalCv): string {
  const sections = prepareSections(cv, "text");

  const frontmatter = [
    "---",
    `title: ${yamlString(cv.owner.displayName || "Curriculum Vitae")}`,
    cv.owner.orcid ? `orcid: ${yamlString(cv.owner.orcid)}` : null,
    `generated: ${yamlString(cv.provenance.generatedAt)}`,
    "source: openalex",
    "---",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const body = sections
    .map(({ section, items }) => {
      if (items.length === 0) return "";
      const lines = items.map(({ item, entry }, i) => {
        let text = escapeMarkdown(entry);
        if (
          cv.display.highlightSelf &&
          item.authoredBySelf &&
          item.selfNameVariants.length > 0
        ) {
          text = wrapSelf(
            text,
            item.selfNameVariants.map(escapeMarkdown),
            (s) => `**${s}**`,
          );
        }
        return `${i + 1}. ${text}`;
      });
      return `## ${section.title}\n\n${lines.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const heading = cv.owner.displayName || "Curriculum Vitae";
  const metrics = metricsLineText(cv);
  const metricsBlock = metrics ? `*${escapeMarkdown(metrics)}*\n\n` : "";
  return `${frontmatter}\n\n# ${heading}\n\n${metricsBlock}${body}\n`;
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
