import type { CanonicalCv } from "@/lib/canonical/schema";
import { licenseInfo } from "@/lib/canonical/license";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "../authorship";
import { renderChartsHtml } from "../charts";
import { escapeHtml, safeHref } from "../escape";
import { formattedMetrics } from "../metrics";
import { SITE_URL } from "@/lib/siteUrl";
import type { RenderOpts } from "../types";
import type { RenderedSection, TemplateTheme } from "./types";

export { escapeHtml };

/**
 * The optional authorship-summary table (counts of first/last/corresponding/…
 * across peer-reviewed publications). "" when disabled or empty.
 */
export function authorshipTableHtml(cv: CanonicalCv): string {
  if (!cv.display.showAuthorshipTable) return "";
  const rows = authorshipCounts(cv, cv.display.authorshipRoles);
  if (rows.length === 0) return "";
  // An all-zero table is noise in the final document (typically stale data with
  // no author positions yet) — omit it rather than print a column of zeros.
  if (rows.every((r) => r.count === 0)) return "";
  const loc = cv.display.locale;
  const total = rows[0]?.total ?? 0;
  const numFmt = new Intl.NumberFormat(loc);
  const pctFmt = new Intl.NumberFormat(loc, { style: "percent" });
  // Each row shows the count plus its share of the peer-reviewed corpus, so a
  // role reads as "12 (30%)" rather than a bare number with no denominator.
  const body = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(authorshipRoleLabel(loc, r.role))}</td><td class="cv-authorship-n">${numFmt.format(
          r.count,
        )}<span class="cv-authorship-pct">(${pctFmt.format(r.percent / 100)})</span></td></tr>`,
    )
    .join("");
  const s = renderStrings(loc);
  // Corresponding-author coverage in OpenAlex is sparse, so a "Corresponding"
  // count systematically undercounts — footnote it so it isn't read as fact.
  const note = rows.some((r) => r.role === "corresponding")
    ? `<p class="cv-authorship-note">${escapeHtml(s.authorshipCorrespondingNote)}</p>`
    : "";
  // Surface the denominator (n) so the percentages are interpretable — a 50%
  // first-author share means something different over 4 papers than over 80.
  const caption = `${escapeHtml(s.authorshipCaption)} · n=${numFmt.format(total)}`;
  return `<table class="cv-authorship"><caption>${caption}</caption><tbody>${body}</tbody></table>${note}`;
}

/** A profile photo `<img>` (data URL), or "" if none. img-src data: is CSP-allowed. */
export function photoHtml(cv: CanonicalCv): string {
  const photo = cv.owner.photo;
  if (!photo) return "";
  // Give the portrait an accessible name on the published page (the owner's
  // display name) rather than an empty alt that tells a screen-reader nothing.
  const alt = escapeHtml(cv.owner.displayName || "");
  return `<img class="cv-photo" src="${escapeHtml(photo)}" alt="${alt}" />`;
}

/** The contact line: location · email · phone · website (+ extra links). */
function contactHtml(cv: CanonicalCv): string {
  const c = cv.owner.contact ?? {};
  const parts: string[] = [];
  if (c.location) parts.push(escapeHtml(c.location));
  if (c.email) {
    const href = safeHref(`mailto:${c.email}`);
    parts.push(href ? `<a href="${escapeHtml(href)}">${escapeHtml(c.email)}</a>` : escapeHtml(c.email));
  }
  if (c.phone) parts.push(escapeHtml(c.phone));
  if (c.website) {
    // Only render the website when it resolves to a SAFE href; an unsafe scheme
    // (javascript:/data:/…) is dropped entirely rather than shown as raw text.
    const href = safeHref(c.website);
    if (href) parts.push(`<a href="${escapeHtml(href)}">${escapeHtml(c.website)}</a>`);
  }
  const links = (cv.owner.links ?? [])
    .map((l) => {
      const href = safeHref(l.url);
      const label = escapeHtml(l.label || l.url);
      return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
    })
    .filter(Boolean);
  const contactLine = parts.length
    ? `<div class="cv-contact">${parts.join(" · ")}</div>`
    : "";
  const linksLine = links.length
    ? `<div class="cv-links">${links.join(" · ")}</div>`
    : "";
  return contactLine + linksLine;
}

/**
 * Wrap template-specific CSS + body into a complete HTML document. The strict
 * CSP means injected markup (from citeproc output) can never execute — applies
 * to both the preview iframe and the headless-Chromium PDF page.
 */
/**
 * Localized document `<title>`: "Name — Curriculum Vitae" (translated), or just
 * the localized fallback ("履歴書", "Lebenslauf", …) when no name is set.
 */
export function cvDocTitle(cv: CanonicalCv): string {
  const fallback = renderStrings(cv.display.locale).cvFallbackTitle;
  const name = cv.owner.displayName?.trim();
  return name ? `${name} — ${fallback}` : fallback;
}

/**
 * `pageShell` bound to a CV: emits the localized title AND sets `<html lang>` to
 * the CV's content locale (BCP-47), so an exported French/Korean/… CV is not
 * mis-declared as English to screen readers, hyphenation, and crawlers. Every
 * template should use this instead of calling `pageShell` directly.
 */
export function cvPageShell(cv: CanonicalCv, css: string, body: string): string {
  return pageShell(cvDocTitle(cv), css, body, cv.display.locale);
}

export function pageShell(
  title: string,
  css: string,
  body: string,
  lang = "en",
): string {
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

/** Reset + bibliography + self-highlight CSS common to every template. */
export function commonCss(theme: TemplateTheme): string {
  return `
  :root {
    /* A CV is a light document. Declare it light-only so a browser's auto
       dark-mode never inverts the page (white→dark) in the preview iframe or
       on screen — PDF export is already light. Explicit dark fills (e.g. the
       Slate header band, Aurora gradient) are authored colours, unaffected. */
    color-scheme: light;
    --cv-accent: ${theme.accentColor};
    --cv-accent-soft: ${theme.accentSoft};
    --cv-ink: #1a1d23;
    --cv-ink-2: #3d434d;
    --cv-muted: #5d646f;
    --cv-faint: #6b7280;
    --cv-rule: #e6e8ec;
    --cv-rule-strong: #c9ccd3;
    --cv-page: #ffffff;
    --cv-space: ${theme.sectionGapRem}rem;
    --cv-entry-gap: ${theme.entryGapRem}rem;
    --cv-hang: 1.5em;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${theme.fontFamily};
    font-size: ${theme.bodyFontPt}pt;
    line-height: ${theme.lineHeight};
    color: var(--cv-ink);
    background: var(--cv-page);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-kerning: normal;
    font-variant-ligatures: common-ligatures;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cv { max-width: 780px; margin: 0 auto; padding: 44px 52px; }

  header.cv-header h1 {
    font-size: ${theme.nameSizeRem}rem;
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.012em;
    margin: 0 0 0.15rem;
    color: var(--cv-ink);
  }
  .cv-headmain { display: flex; gap: 1.6rem; align-items: flex-start; justify-content: space-between; }
  .cv-headtext { flex: 1 1 auto; min-width: 0; }
  .cv-photo { flex: none; width: 104px; height: 104px; border-radius: 10px; object-fit: cover; }
  /* The honorific (e.g. "Dr") must be visually IDENTICAL to the name: same size,
     weight, font and colour. It sits inside the <h1>, so inheriting everything
     achieves that on every template; the single literal space in the markup
     separates it from the name. */
  .cv-honorific { font: inherit; color: inherit; opacity: 1; letter-spacing: inherit; }
  .cv-headline { font-size: 1.2rem; font-weight: 500; color: var(--cv-ink-2); margin-top: 0.15rem; letter-spacing: 0; }
  .cv-ids { font-size: 0.82rem; color: var(--cv-muted); margin-top: 0.35rem; }
  .cv-ids a { color: var(--cv-accent); text-decoration: none; }
  .cv-contact, .cv-links { font-size: 0.82rem; color: var(--cv-muted); margin-top: 0.3rem; line-height: 1.5; }
  .cv-links { margin-top: 0.1rem; }
  .cv-contact a, .cv-links a { color: var(--cv-muted); text-decoration: none; }
  .cv-summary { margin: 0.95rem 0 0; font-size: 0.95rem; color: var(--cv-ink-2); line-height: 1.55; }
  .cv-metrics { font-size: 0.8rem; color: var(--cv-muted); margin-top: 0.4rem; display: flex; flex-wrap: wrap; gap: 0.15rem 1.1rem; }
  .cv-metric-context { color: var(--cv-faint); font-style: italic; }

  section.cv-section { margin-top: var(--cv-space); }
  section.cv-section:first-of-type { margin-top: calc(var(--cv-space) * 0.6); }
  section.cv-section > h2 { font-size: 0.95rem; font-weight: 600; color: var(--cv-ink); margin: 0 0 0.65rem; }

  /* Narrative-CV block (funder résumé prose) — sits ABOVE the sections. Reads as
     running prose: a module heading then escaped paragraphs / bullet lists. */
  section.cv-narrative { margin-top: calc(var(--cv-space) * 0.6); }
  .cv-narrative-module { margin-top: var(--cv-space); }
  .cv-narrative-module:first-child { margin-top: 0; }
  .cv-narrative-module > h3 { font-size: 0.95rem; font-weight: 600; color: var(--cv-ink); margin: 0 0 0.45rem; }
  .cv-narrative-module p { margin: 0 0 0.55rem; line-height: 1.55; color: var(--cv-ink-2); }
  .cv-narrative-module p:last-child { margin-bottom: 0; }
  ul.cv-narrative-list { margin: 0.2rem 0 0.6rem; padding-left: 1.2rem; }
  ul.cv-narrative-list > li { margin: 0 0 0.2rem; line-height: 1.5; color: var(--cv-ink-2); }

  ol.cv-bib { list-style: none; margin: 0; padding: 0; }
  ol.cv-bib > li { margin: 0 0 var(--cv-entry-gap); padding-left: var(--cv-hang); text-indent: calc(var(--cv-hang) * -1); line-height: 1.42; }
  .csl-entry { display: inline; }
  ol.cv-bib > li a { color: var(--cv-accent); text-decoration: none; }

  .cv-self { ${theme.selfHighlightCss} }

  /* Inline badges after each entry. Plain inline-block + adjacent-sibling margins
     (NOT flex gap, which proved unreliable for a wide role badge sitting next to
     the count) so each badge is reliably separated from the text and from the
     others. The three kinds are also DIFFERENT colours (green OA / grey role /
     blue count) so adjacent pills never read as one merged blob. */
  /* text-indent: 0 is CRITICAL — the bibliography li uses a NEGATIVE text-indent
     for its hanging indent, and text-indent is inherited; on an inline-block badge
     that shifts the badge's OWN text left, out of its coloured pill (the text slid
     onto the previous badge while the background stayed put). */
  .cv-badges { margin-left: 0.6em; text-indent: 0; }
  .cv-badge { display: inline-block; text-indent: 0; font-size: 0.6rem; font-weight: 600; line-height: 1.45; padding: 0.08em 0.55em; border-radius: 999px; white-space: nowrap; letter-spacing: 0.03em; vertical-align: 0.08em; }
  .cv-badge + .cv-badge { margin-left: 0.5rem; }
  .cv-badge-oa { color: #0e7066; background: #e7f4f1; border: 1px solid #bfe3dc; }
  .cv-badge-role { color: var(--cv-muted); background: #f2f3f5; border: 1px solid var(--cv-rule); text-transform: lowercase; }
  .cv-badge-cites { color: #1e40af; background: #dbeafe; border: 1px solid #93c5fd; font-variant-numeric: tabular-nums; }

  /* The authorship table sits in a guaranteed light card with fixed dark text,
     so it stays legible on EVERY template — including ones with a coloured
     header/sidebar (where themed --cv-ink/--cv-muted could vanish). */
  .cv-authorship { border-collapse: separate; border-spacing: 0; margin-top: 0.9rem; font-size: 0.8rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.45rem 0.85rem 0.5rem; color: #374151; }
  .cv-authorship caption { text-align: left; font-size: 0.66rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; margin-bottom: 0.3rem; }
  .cv-authorship td { padding: 0.14rem 1.1rem 0.14rem 0; color: #374151; }
  .cv-authorship .cv-authorship-n { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #111827; padding-right: 0; }
  .cv-authorship .cv-authorship-pct { margin-left: 0.4rem; font-weight: 400; color: #6b7280; }
  .cv-authorship-note { font-size: 0.62rem; color: var(--cv-faint); margin: 0.3rem 0 0; font-style: italic; }
  /* Charts sit in a guaranteed light card so the accent-coloured bars stay
     visible on EVERY template — including ones with a coloured header/sidebar
     (where accent bars would otherwise vanish into an accent background). */
  .cv-charts { display: inline-flex; flex-wrap: wrap; gap: 1.2rem 1.6rem; margin-top: 0.9rem; padding: 0.7rem 0.95rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 100%; }
  .cv-chart { margin: 0; }
  .cv-chart figcaption { font-size: 0.66rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #374151; margin-bottom: 0.25rem; }
  .cv-chart svg { display: block; }
  .cv-chart rect { stroke: rgba(0, 0, 0, 0.12); stroke-width: 0.5; }

  .cv-provenance { margin-top: 2.2rem; padding-top: 0.7rem; border-top: 1px solid var(--cv-rule); font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  /* Whole-CV reuse license line — a quiet footnote under the document. When the
     provenance footer is also shown it sits just below it (smaller top margin). */
  .cv-license { margin-top: 1rem; font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  .cv-license a { color: var(--cv-muted); text-decoration: underline; text-underline-offset: 0.15em; }
  /* "Made with SigmaCV" referral footer — public living page ONLY (never in an
     export). A quiet brand backlink under the document. */
  .cv-attribution { margin-top: 1rem; font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  .cv-attribution a { color: var(--cv-accent); text-decoration: none; }
  a { color: inherit; }

  @page { size: A4; margin: 16mm 15mm; }
  @media print {
    .cv { padding: 0; max-width: none; }
    a { text-decoration: none; }
    section.cv-section { break-inside: auto; }
    section.cv-section > h2 { break-after: avoid; break-inside: avoid; }
    ol.cv-bib > li { break-inside: avoid; }
    header.cv-header { break-inside: avoid; break-after: avoid; }
    .cv-chart, figure.cv-chart { break-inside: avoid; }
  }`;
}

/**
 * The header block (shared structure; templates style `.cv-header` differently).
 * `opts.photo` lets visual templates (modern/rirekisho) opt into the photo;
 * text-first templates (classic/minimal/compact/ats) omit it.
 */
export function headerHtml(cv: CanonicalCv, opts: { photo?: boolean } = {}): string {
  const name = escapeHtml(
    cv.owner.displayName || renderStrings(cv.display.locale).cvFallbackTitle,
  );
  // Honorific (e.g. "Dr") sits inline BEFORE the name on the same line; the
  // headline/role is a separate line UNDER the name.
  const honorific = cv.owner.honorific
    ? `<span class="cv-honorific">${escapeHtml(cv.owner.honorific)}</span> `
    : "";
  const headline = cv.owner.headline
    ? `<div class="cv-headline">${escapeHtml(cv.owner.headline)}</div>`
    : "";
  const orcid = cv.owner.orcid ? escapeHtml(cv.owner.orcid) : "";
  const ids = orcid
    ? `<div class="cv-ids">ORCID: <a href="https://orcid.org/${orcid}">${orcid}</a></div>`
    : "";
  const metrics = formattedMetrics(cv);
  const metricsLine = metrics.length
    ? `<div class="cv-metrics">${metrics
        .map(
          (m) =>
            `${escapeHtml(m.label)}: ${escapeHtml(m.value)}${
              m.context
                ? ` <span class="cv-metric-context">(${escapeHtml(m.context)})</span>`
                : ""
            }`,
        )
        .join(" · ")}</div>`
    : "";
  const summary = cv.owner.summary
    ? `<p class="cv-summary">${escapeHtml(cv.owner.summary)}</p>`
    : "";
  const photo = opts.photo ? photoHtml(cv) : "";
  const text = `<div class="cv-headtext"><h1>${honorific}${name}</h1>${headline}${ids}${contactHtml(cv)}${metricsLine}</div>`;
  return `<header class="cv-header"><div class="cv-headmain">${text}${photo}</div>${renderChartsHtml(cv)}${authorshipTableHtml(cv)}${summary}</header>`;
}

const SOURCE_LABEL: Record<string, string> = {
  openalex: "OpenAlex",
  orcid: "ORCID",
  oep: "Open Editors Plus",
  crossref: "Crossref",
  datacite: "DataCite",
  ror: "ROR",
  derived: "derived",
  manual: "manual entries",
};

/**
 * Localized "last synced" date. Formatted in UTC (the timestamp is UTC-stored)
 * so the displayed day never shifts with the render machine's timezone; falls
 * back to the raw ISO date if the value can't be parsed.
 */
function formatSyncDate(iso: string | undefined, locale: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * A small data-provenance footer — what sources built this CV, when it synced,
 * and how much the user curated. Core to "responsible, auditable" CVs.
 */
export function provenanceFooter(cv: CanonicalCv): string {
  if (!cv.display.showProvenance) return "";
  const s = renderStrings(cv.display.locale);
  // "manual entries" / "derived" are descriptive (localized); the rest are
  // proper nouns (OpenAlex, ORCID, …).
  const localizedSource = (src: string): string => {
    if (src === "manual") return s.sourceManualEntries;
    if (src === "derived") return s.sourceDerived;
    return SOURCE_LABEL[src] ?? src;
  };
  const items = cv.sections.flatMap((sec) => sec.items);
  const hidden = items.filter((i) => !i.included).length;
  const corrected = items.filter((i) => i.notMine).length;
  const synced = formatSyncDate(cv.provenance.lastSyncedAt, cv.display.locale);
  const sources = cv.provenance.sources.map(localizedSource).join(", ");
  const parts = [`${s.provGeneratedFrom} ${escapeHtml(sources)}`];
  if (synced) parts.push(`${s.provOn} ${escapeHtml(synced)}`);
  const counts: string[] = [`${items.length} ${s.provRecords}`];
  if (hidden) counts.push(`${hidden} ${s.provHidden}`);
  if (corrected) counts.push(`${corrected} ${s.provCorrected}`);
  // Surface that the peer-reviewed/preprint split (which the peer-reviewed-only
  // filter and the authorship table silently depend on) is a heuristic.
  const note =
    cv.display.peerReviewedOnly || cv.display.showAuthorshipTable
      ? ` · ${escapeHtml(s.provClassificationNote)}`
      : "";
  return `<footer class="cv-provenance">${parts.join(" ")} · ${counts.join(", ")}${note}</footer>`;
}

/**
 * A small whole-CV reuse-license line (FAIR / open-science). Shown only when the
 * owner chose a linkable license (`display.cvLicense` not "none"/closed); the
 * license NAME is a proper noun (CC BY 4.0, CC0 1.0, …) so it is not translated,
 * linked to its canonical SPDX page. "" when there's no license statement to show.
 */
export function licenseFooter(cv: CanonicalCv): string {
  const info = licenseInfo(cv.display.cvLicense);
  if (!info) return "";
  const href = safeHref(info.url);
  const name = escapeHtml(info.name);
  const label = href
    ? `<a href="${escapeHtml(href)}" rel="license">${name}</a>`
    : name;
  return `<footer class="cv-license">${label}</footer>`;
}

/**
 * The "Made with SigmaCV" attribution footer — a small referral backlink to the
 * site root, shown ONLY on the public living page (`/p/[slug]`). The growth-loop
 * link is wanted, so it is a plain follow link (no rel="nofollow").
 *
 * Emitted only when BOTH (a) the caller opted in (`opts.attribution === true` —
 * exporters never do, so PDF/DOCX/LaTeX/Markdown stay unbranded) AND (b) the
 * owner hasn't opted out (`display.publicAttribution !== false`). "" otherwise.
 * "SigmaCV" is the brand name and is never translated; only "Made with" is.
 */
export function attributionFooter(cv: CanonicalCv, opts: RenderOpts = {}): string {
  if (!opts.attribution) return "";
  if (cv.display.publicAttribution === false) return "";
  const href = safeHref(SITE_URL);
  // SITE_URL is an https origin from env/fallback, so safeHref always passes; the
  // guard keeps an unexpected non-http value from ever reaching the href.
  /* v8 ignore next -- SITE_URL is always a safe https origin */
  if (!href) return "";
  const madeWith = escapeHtml(renderStrings(cv.display.locale).madeWith);
  return `<footer class="cv-attribution">${madeWith} <a href="${escapeHtml(
    href,
  )}">SigmaCV</a></footer>`;
}

/**
 * SAFE transform of a narrative module's USER FREE-TEXT body into HTML.
 *
 * The body is user-controlled data, NOT trusted markup — so everything is
 * HTML-escaped first (see `escapeHtml`), and only a MINIMAL, hand-rolled set of
 * structural affordances is then layered on top of the already-escaped text:
 *  - blank lines split the body into `<p>` paragraphs;
 *  - within a paragraph, runs of lines each beginning with "- " become a `<ul>`
 *    of `<li>` items; non-list lines are joined with `<br>`.
 * Raw HTML and arbitrary markdown are NEVER interpreted — an injected
 * `<script>` / `<img onerror=…>` survives only as inert escaped text. This is
 * the single chokepoint; every renderer that shows the narrative uses it.
 */
function narrativeBodyHtml(body: string): string {
  // Normalise newlines, then split into paragraphs on one-or-more blank lines.
  const paragraphs = body
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((p) => p.replace(/^\n+|\n+$/g, ""))
    .filter((p) => p.trim().length > 0);

  return paragraphs
    .map((para) => {
      const lines = para.split("\n");
      const out: string[] = [];
      let listItems: string[] = [];
      const flushList = () => {
        if (listItems.length === 0) return;
        out.push(
          `<ul class="cv-narrative-list">${listItems
            .map((li) => `<li>${escapeHtml(li)}</li>`)
            .join("")}</ul>`,
        );
        listItems = [];
      };
      let textRun: string[] = [];
      const flushText = () => {
        if (textRun.length === 0) return;
        out.push(
          `<p>${textRun.map((t) => escapeHtml(t)).join("<br />")}</p>`,
        );
        textRun = [];
      };
      for (const rawLine of lines) {
        const listMatch = rawLine.match(/^[ \t]*-[ \t]+(.*)$/);
        if (listMatch) {
          flushText();
          listItems.push(listMatch[1]!);
        } else {
          flushList();
          textRun.push(rawLine);
        }
      }
      flushText();
      flushList();
      return out.join("");
    })
    .join("");
}

/**
 * The narrative-CV block (funder résumé prose), rendered ABOVE the sections. Each
 * INCLUDED module with a non-empty body becomes a heading + its safe-transformed
 * body. "" when there is no narrative content to show (so the block is gated by
 * presence — templates can always inline it). The heading + body are both
 * USER FREE-TEXT and are HTML-escaped / safe-transformed; nothing is interpreted
 * as raw HTML or arbitrary markdown.
 */
export function narrativeBlock(cv: CanonicalCv): string {
  const modules = (cv.narrative ?? []).filter(
    (m) => m.included && m.body.trim().length > 0,
  );
  if (modules.length === 0) return "";
  const blocks = modules
    .map(
      (m) =>
        `<section class="cv-narrative-module"><h3>${escapeHtml(
          m.heading,
        )}</h3>${narrativeBodyHtml(m.body)}</section>`,
    )
    .join("");
  return `<section class="cv-narrative">${blocks}</section>`;
}

/** Section list markup (identical across templates; styled via CSS classes). */
export function sectionsHtml(sections: RenderedSection[]): string {
  return sections
    .map((rs) => {
      if (rs.items.length === 0) return "";
      const entries = rs.items
        .map((ri) => `<li><div class="csl-entry">${ri.html}</div></li>`)
        .join("\n");
      return `<section class="cv-section"><h2>${escapeHtml(
        rs.section.title,
      )}</h2><ol class="cv-bib">\n${entries}\n</ol></section>`;
    })
    .join("\n");
}
