import type { CanonicalCv } from "@/lib/canonical/schema";
import { wrapSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { Renderer, RenderInput, RenderResult } from "./types";

const LATEX_ESCAPE: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  $: "\\$",
  "#": "\\#",
  _: "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

function escapeLatex(s: string): string {
  return s.replace(/[\\&%$#_{}~^]/g, (c) => LATEX_ESCAPE[c] ?? c);
}

/**
 * A self-contained LaTeX document. Citations come from citeproc (text output)
 * so the style matches every other format exactly — we do NOT hand off to
 * BibTeX/biblatex (which would re-style). The bibliography is a plain itemize;
 * the user's name is bolded with \textbf on their own works.
 */
export function renderCvLatex(cv: CanonicalCv): string {
  const sections = prepareSections(cv, "text");
  const name = escapeLatex(cv.owner.displayName || "Curriculum Vitae");
  const orcid = cv.owner.orcid ? escapeLatex(cv.owner.orcid) : "";
  const metricsRaw = metricsLineText(cv);
  const metricsLine = metricsRaw
    ? `{\\small ${escapeLatex(metricsRaw)}}\\\\[8pt]`
    : "";
  const head = textHeader(cv);
  const headlineLine = head.headline
    ? `{\\large ${escapeLatex(head.headline)}}\\\\[4pt]`
    : "";
  const contactLine = head.contact.length
    ? `{\\small ${escapeLatex(head.contact.join("  ·  "))}}\\\\[6pt]`
    : "";
  const summaryPar = head.summary
    ? `\\noindent ${escapeLatex(head.summary)}\\par\\medskip\n\n`
    : "";

  const blocks = sections
    .map(({ section, items }) => {
      if (items.length === 0) return "";
      const lines = items.map(({ item, entry }) => {
        let t = escapeLatex(entry);
        if (
          cv.display.highlightSelf &&
          item.authoredBySelf &&
          item.selfNameVariants.length > 0
        ) {
          t = wrapSelf(
            t,
            item.selfNameVariants.map(escapeLatex),
            (s) => `\\textbf{${s}}`,
          );
        }
        return `  \\item ${t}`;
      });
      return `\\section*{${escapeLatex(section.title)}}\n\\begin{itemize}\n${lines.join("\n")}\n\\end{itemize}`;
    })
    .filter(Boolean);

  const preamble = [
    "\\documentclass[11pt]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage[margin=1in]{geometry}",
    "\\usepackage{enumitem}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\setlist[itemize]{leftmargin=*,itemsep=2pt,label={}}",
    "\\begin{document}",
    "\\pagestyle{empty}",
    `{\\Large\\bfseries ${name}}\\\\[2pt]`,
    headlineLine,
    orcid ? `\\href{https://orcid.org/${orcid}}{ORCID: ${orcid}}\\\\[4pt]` : "",
    contactLine,
    metricsLine,
  ]
    .filter(Boolean)
    .join("\n");

  return `${preamble}\n\n${summaryPar}${blocks.join("\n\n")}\n\n\\end{document}\n`;
}

export const latexRenderer: Renderer = {
  format: "latex",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    const text = renderCvLatex(cv);
    return {
      format: "latex",
      mimeType: "application/x-tex; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.tex`,
      text,
    };
  },
};
