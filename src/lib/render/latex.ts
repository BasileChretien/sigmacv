import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { curatedCountsByYear } from "./charts";
import { wrapSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { safeHref } from "./escape";
import { cvSlug } from "./html";
import { isSummaryBlockHidden, metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { PreparedSection } from "./prepare";
import { ensureReadableOnWhite } from "./readableAccent";
import { docStyle, type DocStyle } from "./templateStyle";
import type { Renderer, RenderInput, RenderOpts, RenderResult } from "./types";

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

const URL_RE = /(https?:\/\/[^\s]+)/g;

/** Make a URL safe inside \url{}: an unbalanced brace or backslash would close
 *  the argument early and turn the remainder into live LaTeX (e.g.
 *  `https://x}\input{...}`). Real URLs never need these literally (they'd be
 *  %-encoded), so strip them (braces, backslash, caret, tilde). */
function sanitizeUrlForLatex(url: string): string {
  return url.replace(/[{}\\^~]/g, "");
}

/**
 * Opt-in document QR → the public living page. Compiled IN LaTeX via the standard
 * `qrcode` package (no image file, so a standalone .tex still works), beside the
 * human-readable `\url{}`. Returns the conditional package line + the body block,
 * both "" unless the owner opted in AND the caller supplied the published page URL
 * (never on the ATS template). The URL is run through `safeHref` first (strips any
 * unsafe scheme / `user:pass@` credentials, matching the HTML footer) and then
 * `sanitizeUrlForLatex` defensively — the slug URL has no LaTeX specials anyway.
 */
function docQrLatex(cv: CanonicalCv, opts?: RenderOpts): { pkg: string; body: string } {
  const url = opts?.publicPageUrl;
  if (!url || !cv.display.showDocQr || cv.display.template === "ats") return { pkg: "", body: "" };
  const href = safeHref(url);
  /* v8 ignore next -- publicPageUrl is always a safe absoluteUrl() https origin */
  if (!href) return { pkg: "", body: "" };
  const safe = sanitizeUrlForLatex(href);
  const s = renderStrings(cv.display.locale);
  return {
    pkg: "\\usepackage{qrcode}",
    body: `\\bigskip\\noindent\\qrcode[height=2.2cm]{${safe}}\\quad{\\small ${escapeLatex(
      s.liveVersionLabel,
    )}: \\url{${safe}}}\\par`,
  };
}

/** Escape an entry for LaTeX, but wrap any URL in \url{} so it (a) keeps its raw
 *  characters and (b) can break across lines (via xurl) instead of overflowing
 *  the margin. Self-name highlighting is applied only to the escaped text runs. */
function latexifyEntry(entry: string, bold: ((s: string) => string) | null): string {
  return entry
    .split(URL_RE)
    .map((part) => {
      if (/^https?:\/\//.test(part)) return `\\url{${sanitizeUrlForLatex(part)}}`;
      const escaped = escapeLatex(part);
      return bold ? bold(escaped) : escaped;
    })
    .join("");
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
        const highlight =
          cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0;
        const variants = item.selfNameVariants.map(escapeLatex);
        return latexifyEntry(
          entry,
          highlight ? (escaped) => wrapSelf(escaped, variants, (s) => `\\textbf{${s}}`) : null,
        );
      }),
    }));
}

/** Six-digit HEX (no #) for xcolor's \definecolor{...}{HTML}{...}. Floored to a
 *  readable contrast on white so a pale accent can't render unreadable headings /
 *  name, or a white-on-accent sidebar band, in the .tex (matches HTML/PDF). */
function accentHex(cv: CanonicalCv): string {
  const raw = (cv.display.accentColor || "#1f4fd8").replace(/^#/, "");
  const safe = /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw}` : "#1f4fd8";
  return ensureReadableOnWhite(safe).slice(1).toUpperCase();
}

/** Publications + citations per year as a LaTeX tabular (mirrors the HTML chart
 *  data). "" when charts are off or there's too little data. */
function yearTableLatex(cv: CanonicalCv): string {
  if (!cv.display.showCharts) return "";
  const data = curatedCountsByYear(cv)
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return "";
  const s = renderStrings(cv.display.locale);
  const rows = data.map((d) => `${d.year} & ${d.works} & ${d.citations} \\\\`).join("\n");
  return [
    "\\medskip\\noindent\\begin{tabular}{@{}lrr@{}}",
    ` & \\textbf{${escapeLatex(s.chartPublicationsPerYear)}} & \\textbf{${escapeLatex(s.chartCitationsPerYear)}} \\\\`,
    "\\hline",
    rows,
    "\\end{tabular}\\par",
  ].join("\n");
}

/** The authorship-summary table as a LaTeX tabular. "" when off/empty. */
function authorshipTableLatex(cv: CanonicalCv): string {
  if (!cv.display.showAuthorshipTable) return "";
  const rows = authorshipCounts(cv, cv.display.authorshipRoles);
  if (rows.length === 0 || rows.every((r) => r.count === 0)) return "";
  const s = renderStrings(cv.display.locale);
  const total = rows[0]?.total ?? 0;
  // One metric column reading "16 (18%)" so the count and its share can't run
  // together into a meaningless number.
  const body = rows
    .map(
      (r) =>
        `${escapeLatex(authorshipRoleLabel(cv.display.locale, r.role))} & ${r.count} (${r.percent}\\%) \\\\`,
    )
    .join("\n");
  const note = rows.some((r) => r.role === "corresponding")
    ? `\n{\\footnotesize\\itshape ${escapeLatex(s.authorshipCorrespondingNote)}\\par}`
    : "";
  return [
    "\\medskip\\noindent\\begin{tabular}{@{}lr@{}}",
    `\\multicolumn{2}{@{}l}{\\textbf{${escapeLatex(s.authorshipCaption)} \\textperiodcentered{} n=${total}}} \\\\`,
    "\\hline",
    body,
    "\\end{tabular}\\par" + note,
  ].join("\n");
}

/**
 * Template-aware professional design: the accent colour, serif/sans body, and
 * heading + name treatment follow the CHOSEN TEMPLATE (Classic → centred serif;
 * Modern → accent name; ATS → plain monochrome; etc.), so the .tex resembles
 * the on-screen template. Self-contained — only packages from a standard TeX
 * Live, so it compiles everywhere (no moderncv/altacv class).
 */
function buildStyled(cv: CanonicalCv, style: DocStyle, opts?: RenderOpts): string {
  const qr = docQrLatex(cv, opts);
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
  // The plain LaTeX export keeps its fixed layout but honours the "hidden"
  // placement (suppress the metrics line + the chart/authorship tables).
  const summaryHidden = isSummaryBlockHidden(cv);
  const metricsRaw = summaryHidden ? "" : metricsLineText(cv);

  const blocks = sectionItems(cv, sections).map(
    ({ title, lines }) =>
      `\\section{${title}}\n\\begin{cvlist}\n${lines
        .map((l) => `  \\item ${l}`)
        .join("\n")}\n\\end{cvlist}`,
  );

  // Plain (ATS) ⇒ no accent anywhere; otherwise accent headings/rule and links.
  const headColor = style.accentHeadings && !style.plain ? "\\color{cvaccent}" : "";
  const rule =
    style.accentHeadings && !style.plain
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
    "\\usepackage{xurl}",
    qr.pkg,
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
    `{\\fontsize{24}{27}\\selectfont\\bfseries ${nameColor}${name}}\\\\[3pt]`,
    headline ? `{\\large ${headline}}\\\\[3pt]` : "",
    contactLine ? `{\\small\\color{black!65}${contactLine}}\\\\[2pt]` : "",
    metricsRaw ? `{\\small\\itshape\\color{black!55}${escapeLatex(metricsRaw)}}\\\\[2pt]` : "",
    style.plain ? "" : "{\\color{cvaccent}\\rule{\\linewidth}{1.1pt}}\\\\[2pt]",
  ].filter(Boolean);
  // Classic centres the masthead; everything else is left-aligned.
  const header = style.centeredHeader
    ? `\\begin{center}\n${headerLines.join("\n")}\n\\end{center}`
    : headerLines.join("\n");

  const summaryPar = head.summary ? `\\medskip\n${escapeLatex(head.summary)}\\par\n` : "";

  // Charts + authorship render as tables (LaTeX can't draw the bar charts).
  const tables = summaryHidden
    ? ""
    : [yearTableLatex(cv), authorshipTableLatex(cv)].filter(Boolean).join("\n");

  // A photo can't be embedded in a standalone .tex; leave a ready-to-use line
  // the author can enable once they save the image next to this file.
  const photoNote = cv.owner.photo
    ? "% To add your photo: save it as cv-photo.jpg beside this .tex, then add\n% \\usepackage{graphicx} and \\includegraphics[width=2.8cm]{cv-photo} where you want it.\n"
    : "";

  return `${preamble}\n${photoNote}${header}\n${tables}\n${summaryPar}\n${blocks.join("\n\n")}\n${
    qr.body ? `\n${qr.body}\n` : ""
  }\n\\end{document}\n`;
}

/** Sidebar template: a two-column layout with a coloured left panel (name,
 *  contact, metrics in white) and the content on the right — built with paracol
 *  so the accent column runs full page height. */
function buildSidebarLatex(cv: CanonicalCv, style: DocStyle, opts?: RenderOpts): string {
  const qr = docQrLatex(cv, opts);
  const sections = prepareSections(cv, "text");
  const head = textHeader(cv);
  const name = escapeLatex(
    (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
      (cv.owner.displayName || renderStrings(cv.display.locale).cvFallbackTitle),
  );
  const summaryHidden = isSummaryBlockHidden(cv);
  const metricsRaw = summaryHidden ? "" : metricsLineText(cv);

  // Joined with line breaks BETWEEN items (no leading/trailing \\, which would
  // trigger "no line here to end" in the paracol column).
  const leftBits = [
    `{\\Large\\bfseries ${name}}`,
    head.headline ? `{\\large ${escapeLatex(head.headline)}}` : "",
    cv.owner.orcid ? `{\\small ORCID: ${escapeLatex(cv.owner.orcid)}}` : "",
    ...head.contact.map((c) => `{\\small ${escapeLatex(c)}}`),
    metricsRaw ? `{\\small\\itshape ${escapeLatex(metricsRaw)}}` : "",
  ]
    .filter(Boolean)
    .join(" \\\\[6pt]\n");

  const summaryPar = head.summary ? `${escapeLatex(head.summary)}\\par\\medskip\n` : "";
  const tables = summaryHidden
    ? ""
    : [yearTableLatex(cv), authorshipTableLatex(cv)].filter(Boolean).join("\n");
  const blocks = sectionItems(cv, sections)
    .map(
      ({ title, lines }) =>
        `\\section{${title}}\n\\begin{cvlist}\n${lines
          .map((l) => `  \\item ${l}`)
          .join("\n")}\n\\end{cvlist}`,
    )
    .join("\n\n");
  const photoNote = cv.owner.photo
    ? "% To add your photo: save cv-photo.jpg beside this file, add \\usepackage{graphicx}\n% and \\includegraphics[width=\\linewidth]{cv-photo} at the top of the left column.\n"
    : "";

  const preamble = [
    "\\documentclass[11pt,a4paper]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{lmodern}",
    style.serif ? "" : "\\renewcommand{\\familydefault}{\\sfdefault}",
    "\\usepackage{microtype}",
    "\\usepackage[margin=0.8in]{geometry}",
    "\\usepackage{xcolor}",
    "\\usepackage{enumitem}",
    "\\usepackage{titlesec}",
    "\\usepackage[hidelinks]{hyperref}",
    "\\usepackage{xurl}",
    qr.pkg,
    "\\usepackage{paracol}",
    "\\usepackage{eso-pic}",
    `\\definecolor{cvaccent}{HTML}{${accentHex(cv)}}`,
    "\\hypersetup{colorlinks=true,urlcolor=cvaccent,linkcolor=cvaccent}",
    "\\titleformat{\\section}{\\large\\bfseries\\color{cvaccent}}{}{0em}{}[{\\color{cvaccent}\\titlerule[1pt]}]",
    "\\titlespacing*{\\section}{0pt}{1.1em}{0.5em}",
    "\\newlist{cvlist}{itemize}{1}",
    "\\setlist[cvlist]{leftmargin=1.1em,itemsep=4pt,topsep=2pt,label={}}",
    "\\setlength{\\parindent}{0pt}",
    "\\columnratio{0.34}",
    "\\setlength{\\columnsep}{1.6em}",
    // Paint a full-height accent band on the left, exactly as wide as the
    // 0.8in margin + column-0 width (+0.5em inner padding), evaluated at shipout
    // so \\textwidth/\\columnsep are final. Deterministic — it can never overrun
    // column 1 (which starts a full \\columnsep further right).
    "\\AddToShipoutPictureBG{\\AtPageLowerLeft{\\color{cvaccent}\\rule{\\the\\dimexpr 0.8in+0.34\\textwidth-0.34\\columnsep+0.5em\\relax}{\\paperheight}}}",
    "\\pagestyle{empty}",
    "\\begin{document}",
  ]
    .filter(Boolean)
    .join("\n");

  // The left (accent) column prints white on the coloured panel; \switchcolumn
  // resets to black so the right column's body text is NOT white-on-white.
  return `${preamble}\n${photoNote}\\begin{paracol}{2}\n\\color{white}\\raggedright\n${leftBits}\n\\switchcolumn\n\\color{black}\n${summaryPar}${tables}\n\n${blocks}\n${qr.body ? `${qr.body}\n` : ""}\\end{paracol}\n\\end{document}\n`;
}

/** Render a .tex that follows the chosen template (accent, font, heading + name
 *  treatment). A single self-contained design that compiles on a bare TeX Live. */
export function renderCvLatex(cv: CanonicalCv, opts?: RenderOpts): string {
  const style = docStyle(cv);
  return style.twoColumn ? buildSidebarLatex(cv, style, opts) : buildStyled(cv, style, opts);
}

export const latexRenderer: Renderer = {
  format: "latex",
  async render({ cv, opts }: RenderInput): Promise<RenderResult> {
    return {
      format: "latex",
      mimeType: "application/x-tex; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.tex`,
      text: renderCvLatex(cv, opts),
    };
  },
};
