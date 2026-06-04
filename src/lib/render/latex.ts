import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { wrapSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { PreparedSection } from "./prepare";
import { docStyle, type DocStyle } from "./templateStyle";
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

/** Citations come from citeproc (text output) so the style matches every other
 *  format exactly. The account holder's name is bolded on their own works. */
function sectionItems(
  cv: CanonicalCv,
  sections: PreparedSection[],
): { title: string; lines: string[] }[] {
  return sections
    .filter(({ items }) => items.length > 0)
    .map(({ section, items }) => ({
      title: escapeLatex(section.title),
      lines: items.map(({ item, entry }) => {
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
        return t;
      }),
    }));
}

/** Six-digit HEX (no #) for xcolor's \definecolor{...}{HTML}{...}. */
function accentHex(cv: CanonicalCv): string {
  const raw = (cv.display.accentColor || "#1f4fd8").replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : "1F4FD8";
}

/**
 * Template-aware professional design: the accent colour, serif/sans body, and
 * heading + name treatment follow the CHOSEN TEMPLATE (Classic → centred serif;
 * Modern → accent name; ATS → plain monochrome; etc.), so the .tex resembles
 * the on-screen template. Self-contained — only packages from a standard TeX
 * Live, so it compiles everywhere (no moderncv/altacv class).
 */
function buildStyled(cv: CanonicalCv, style: DocStyle): string {
  const sections = prepareSections(cv, "text");
  const head = textHeader(cv);
  const name = escapeLatex(
    (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
      (cv.owner.displayName || renderStrings(cv.display.locale).cvFallbackTitle),
  );
  const headline = head.headline ? escapeLatex(head.headline) : "";
  const contactBits: string[] = [];
  if (cv.owner.orcid) {
    const o = escapeLatex(cv.owner.orcid);
    contactBits.push(`\\href{https://orcid.org/${o}}{ORCID ${o}}`);
  }
  for (const c of head.contact) contactBits.push(escapeLatex(c));
  const contactLine = contactBits.join("  \\textbullet{}  ");
  const metricsRaw = metricsLineText(cv);

  const blocks = sectionItems(cv, sections).map(
    ({ title, lines }) =>
      `\\section{${title}}\n\\begin{cvlist}\n${lines
        .map((l) => `  \\item ${l}`)
        .join("\n")}\n\\end{cvlist}`,
  );

  // Plain (ATS) ⇒ no accent anywhere; otherwise accent headings/rule and links.
  const headColor = style.accentHeadings && !style.plain ? "\\color{cvaccent}" : "";
  const rule = style.accentHeadings && !style.plain
    ? "[{\\color{cvaccent}\\titlerule[1pt]}]"
    : "[{\\titlerule}]";
  const nameColor = style.accentName && !style.plain ? "\\color{cvaccent}" : "";
  const linkColor = style.plain ? "black" : "cvaccent";

  const preamble = [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{lmodern}",
    style.serif ? "" : "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\usepackage{microtype}",
    "\\usepackage[margin=0.9in]{geometry}",
    "\\usepackage{xcolor}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    `\\definecolor{cvaccent}{HTML}{${accentHex(cv)}}`,
    `\\hypersetup{colorlinks=true,urlcolor=${linkColor},linkcolor=${linkColor}}`,
    `\\titleformat{\\section}{\\large\\bfseries${headColor}}{}{0em}{}${rule}`,
    "\\titlespacing*{\\section}{0pt}{1.3em}{0.55em}",
    "\\newlist{cvlist}{itemize}{1}",
    "\\setlist[cvlist]{leftmargin=1.1em,itemsep=4pt,topsep=2pt,label={}}",
    "\\setlength{\\parindent}{0pt}",
    "\\pagestyle{empty}",
    "\\begin{document}",
  ]
    .filter(Boolean)
    .join("\n");

  const headerLines = [
    `{\\fontsize{24}{27}\\selectfont\\bfseries${nameColor}${name}}\\\\[3pt]`,
    headline ? `{\\large ${headline}}\\\\[3pt]` : "",
    contactLine ? `{\\small\\color{black!65}${contactLine}}\\\\[2pt]` : "",
    metricsRaw ? `{\\small\\itshape\\color{black!55}${escapeLatex(metricsRaw)}}\\\\[2pt]` : "",
    style.plain ? "" : "{\\color{cvaccent}\\rule{\\linewidth}{1.1pt}}\\\\[2pt]",
  ].filter(Boolean);
  // Classic centres the masthead; everything else is left-aligned.
  const header = style.centeredHeader
    ? `\\begin{center}\n${headerLines.join("\n")}\n\\end{center}`
    : headerLines.join("\n");

  const summaryPar = head.summary
    ? `\\medskip\n${escapeLatex(head.summary)}\\par\n`
    : "";

  return `${preamble}\n${header}\n${summaryPar}\n${blocks.join("\n\n")}\n\n\\end{document}\n`;
}

/** Render a .tex that follows the chosen template (accent, font, heading + name
 *  treatment). A single self-contained design that compiles on a bare TeX Live. */
export function renderCvLatex(cv: CanonicalCv): string {
  return buildStyled(cv, docStyle(cv));
}

export const latexRenderer: Renderer = {
  format: "latex",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "latex",
      mimeType: "application/x-tex; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.tex`,
      text: renderCvLatex(cv),
    };
  },
};
