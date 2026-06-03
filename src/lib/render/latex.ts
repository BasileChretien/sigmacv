import type { CanonicalCv } from "@/lib/canonical/schema";
import { wrapSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { PreparedSection } from "./prepare";
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

/** A minimal, dependency-light article layout (compiles with a bare TeX Live). */
function buildClassic(cv: CanonicalCv): string {
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

  const blocks = sectionItems(cv, sections).map(
    ({ title, lines }) =>
      `\\section*{${title}}\n\\begin{itemize}\n${lines
        .map((l) => `  \\item ${l}`)
        .join("\n")}\n\\end{itemize}`,
  );

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

/** Six-digit HEX (no #) for xcolor's \definecolor{...}{HTML}{...}. */
function accentHex(cv: CanonicalCv): string {
  const raw = (cv.display.accentColor || "#1f4fd8").replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : "1F4FD8";
}

/**
 * A polished, professional design — accent-coloured name + section rules,
 * refined typography (lmodern + microtype), coloured DOIs. Self-contained:
 * uses only packages shipped with any standard TeX Live, so it compiles
 * everywhere (no moderncv/altacv class required).
 */
function buildModern(cv: CanonicalCv): string {
  const sections = prepareSections(cv, "text");
  const head = textHeader(cv);
  const name = escapeLatex(cv.owner.displayName || "Curriculum Vitae");
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

  const preamble = [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{lmodern}",
    "\\usepackage{microtype}",
    "\\usepackage[margin=0.9in]{geometry}",
    "\\usepackage{xcolor}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    `\\definecolor{cvaccent}{HTML}{${accentHex(cv)}}`,
    "\\hypersetup{colorlinks=true,urlcolor=cvaccent,linkcolor=cvaccent}",
    "\\titleformat{\\section}{\\large\\bfseries\\color{cvaccent}}{}{0em}{}[{\\color{cvaccent}\\titlerule[1pt]}]",
    "\\titlespacing*{\\section}{0pt}{1.3em}{0.55em}",
    "\\newlist{cvlist}{itemize}{1}",
    "\\setlist[cvlist]{leftmargin=1.1em,itemsep=4pt,topsep=2pt,label={}}",
    "\\setlength{\\parindent}{0pt}",
    "\\pagestyle{empty}",
    "\\begin{document}",
  ].join("\n");

  const header = [
    `{\\fontsize{24}{27}\\selectfont\\bfseries\\color{cvaccent}${name}}\\\\[3pt]`,
    headline ? `{\\large ${headline}}\\\\[3pt]` : "",
    contactLine ? `{\\small\\color{black!65}${contactLine}}\\\\[2pt]` : "",
    metricsRaw ? `{\\small\\itshape\\color{black!55}${escapeLatex(metricsRaw)}}\\\\[2pt]` : "",
    "{\\color{cvaccent}\\rule{\\linewidth}{1.1pt}}\\\\[2pt]",
  ]
    .filter(Boolean)
    .join("\n");

  const summaryPar = head.summary
    ? `\\medskip\n${escapeLatex(head.summary)}\\par\n`
    : "";

  return `${preamble}\n${header}\n${summaryPar}\n${blocks.join("\n\n")}\n\n\\end{document}\n`;
}

export type LatexVariant = "classic" | "modern";

/** The two LaTeX designs are chosen at export time (two entries in the export
 *  menu), not via a persisted setting. "modern" is the polished default. */
export function renderCvLatex(
  cv: CanonicalCv,
  variant: LatexVariant = "modern",
): string {
  return variant === "classic" ? buildClassic(cv) : buildModern(cv);
}

function latexResult(cv: CanonicalCv, variant: LatexVariant): RenderResult {
  return {
    format: variant === "classic" ? "latex-classic" : "latex",
    mimeType: "application/x-tex; charset=utf-8",
    filename: `${cvSlug(cv.owner.displayName)}-cv.tex`,
    text: renderCvLatex(cv, variant),
  };
}

/** Modern (professional) LaTeX export. */
export const latexRenderer: Renderer = {
  format: "latex",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return latexResult(cv, "modern");
  },
};

/** Classic (minimal) LaTeX export. */
export const latexClassicRenderer: Renderer = {
  format: "latex-classic",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return latexResult(cv, "classic");
  },
};
