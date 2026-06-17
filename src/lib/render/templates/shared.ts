import { isMascotStyle, isProseSectionType, type CanonicalCv } from "@/lib/canonical/schema";
import { licenseInfo } from "@/lib/canonical/license";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "../authorship";
import { renderChartsHtml } from "../charts";
import { escapeHtml, safeHref } from "../escape";
import { formattedMetrics, openAccessShare } from "../metrics";
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

/**
 * User-typed URLs (the free-text website + extra profile links) are the only
 * anchors on a published CV whose target the account holder fully controls, so
 * they carry `nofollow ugc` — a spam CV must not pass link equity from our
 * domain. Identifier-derived links (DOI, ORCID, ROR, license) stay plain
 * `noopener noreferrer`, appended by `externalizeLinks`, which skips anchors
 * that already declare a rel — hence the full rel is spelled out here.
 */
const UGC_REL = ' rel="nofollow ugc noopener noreferrer"';

/** The contact line: location · email · phone · website (+ extra links). */
function contactHtml(cv: CanonicalCv): string {
  const c = cv.owner.contact ?? {};
  const parts: string[] = [];
  if (c.location) parts.push(escapeHtml(c.location));
  if (c.email) {
    const href = safeHref(`mailto:${c.email}`);
    parts.push(
      href ? `<a href="${escapeHtml(href)}">${escapeHtml(c.email)}</a>` : escapeHtml(c.email),
    );
  }
  if (c.phone) parts.push(escapeHtml(c.phone));
  if (c.website) {
    // Only render the website when it resolves to a SAFE href; an unsafe scheme
    // (javascript:/data:/…) is dropped entirely rather than shown as raw text.
    const href = safeHref(c.website);
    if (href) parts.push(`<a href="${escapeHtml(href)}"${UGC_REL}>${escapeHtml(c.website)}</a>`);
  }
  const links = (cv.owner.links ?? [])
    .map((l) => {
      const href = safeHref(l.url);
      const label = escapeHtml(l.label || l.url);
      return href ? `<a href="${escapeHtml(href)}"${UGC_REL}>${label}</a>` : label;
    })
    .filter(Boolean);
  const contactLine = parts.length ? `<div class="cv-contact">${parts.join(" · ")}</div>` : "";
  const linksLine = links.length ? `<div class="cv-links">${links.join(" · ")}</div>` : "";
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

export function pageShell(title: string, css: string, body: string, lang = "en"): string {
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
${externalizeLinks(body)}
</body>
</html>`;
}

/**
 * Make every anchor in a rendered CV document open in a new browsing context
 * (`target="_blank"`) and sever the opener (`rel="noopener noreferrer"`, which
 * also blocks reverse-tabnabbing). Run ONCE over the assembled body so the
 * citation DOI/URL links (from citeproc) and the hand-built links (contact,
 * website, ORCID, ROR, license, attribution) behave identically in the live
 * preview iframe, the public page, and the PDF.
 *
 * Attribute-preserving: an anchor that already declares a `target`/`rel` keeps
 * it (so `rel="license"` survives), and the new attributes are APPENDED at the
 * end of the start tag, so existing markup/prefix-shaped assertions are
 * unchanged. Anchor attribute values are HTML-escaped upstream, so a literal
 * `>` never occurs inside one — `[^>]*` safely captures the whole attribute
 * list, and CSS/text (no `<a` token) is never matched.
 */
export function externalizeLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    let extra = "";
    if (!/\btarget\s*=/i.test(attrs)) extra += ' target="_blank"';
    if (!/\brel\s*=/i.test(attrs)) extra += ' rel="noopener noreferrer"';
    return `<a${attrs}${extra}>`;
  });
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

  /* Prose section body (funder narrative contributions / a free statement).
     Reads as running prose: the section heading (the shared h2) then escaped
     paragraphs / bullet lists. */
  .cv-prose-body { margin: 0; }
  .cv-prose-body p { margin: 0 0 0.55rem; line-height: 1.55; color: var(--cv-ink-2); }
  .cv-prose-body p:last-child { margin-bottom: 0; }
  ul.cv-prose-list { margin: 0.2rem 0 0.6rem; padding-left: 1.2rem; }
  ul.cv-prose-list > li { margin: 0 0 0.2rem; line-height: 1.5; color: var(--cv-ink-2); }

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

  /* Institution → ROR record link on a Positions/Education line (all templates).
     A quiet dotted underline marks the name as linked on screen; print drops the
     dotting so the line reads clean (the PDF anchor still resolves). */
  .cv-ror-link { color: inherit; text-decoration: none; border-bottom: 1px dotted var(--cv-rule-strong); }
  .cv-ror-link:hover { color: var(--cv-accent); border-bottom-color: var(--cv-accent); }

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
     provenance block is also shown it sits just below it (smaller top margin).
     A paragraph (not a landmark) so it doesn't compete with the provenance
     contentinfo region; reset its UA bottom margin to keep the footnote tight. */
  .cv-license { margin: 1rem 0 0; font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  .cv-license a { color: var(--cv-muted); text-decoration: underline; text-underline-offset: 0.15em; }
  /* "Living CV" line — public page ONLY. Tells a visitor the page is current
     ("Updated <date> · updates automatically"); a quiet footnote, not a landmark. */
  .cv-living { margin: 1.4rem 0 0; font-size: 0.66rem; color: var(--cv-muted); letter-spacing: 0.01em; }
  /* "Made with SigmaCV" referral line — public living page ONLY (never in an
     export). A quiet brand backlink under the document (a paragraph, not a
     landmark). */
  .cv-attribution { margin: 0.3rem 0 0; font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  .cv-attribution a { color: var(--cv-accent); text-decoration: none; }
  /* "Co-authors on SigmaCV" block — public living page ONLY (opt-in). A quiet
     inline list of collaborators who also have a public SigmaCV CV. */
  .cv-coauthors { margin: 1.4rem 0 0; }
  .cv-coauthors-h { margin: 0 0 0.35rem; font-size: 0.66rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--cv-muted); }
  .cv-coauthors-list { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.2rem 0.85rem; font-size: 0.78rem; }
  .cv-coauthors-list a { color: var(--cv-accent); text-decoration: none; }
  a { color: inherit; }

  @page { size: A4; margin: 16mm 15mm; }
  @media print {
    .cv { padding: 0; max-width: none; }
    a { text-decoration: none; }
    .cv-ror-link { border-bottom: none; }
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
  const name = escapeHtml(cv.owner.displayName || renderStrings(cv.display.locale).cvFallbackTitle);
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
              m.context ? ` <span class="cv-metric-context">(${escapeHtml(m.context)})</span>` : ""
            }`,
        )
        .join(" · ")}</div>`
    : "";
  // Profile-level open-access share — opt-in (display.showOpenAccess), shown only
  // when works carry an OA determination. Pairs with the per-entry OA badges.
  const oaShare = openAccessShare(cv);
  const oaShareLine = oaShare
    ? `<div class="cv-oa-share">${escapeHtml(
        renderStrings(cv.display.locale).openAccessShare.replace("{pct}", String(oaShare.pct)),
      )}</div>`
    : "";
  const summary = cv.owner.summary
    ? `<p class="cv-summary">${escapeHtml(cv.owner.summary)}</p>`
    : "";
  const photo = opts.photo ? photoHtml(cv) : "";
  const text = `<div class="cv-headtext"><h1>${honorific}${name}</h1>${headline}${ids}${contactHtml(cv)}${metricsLine}${oaShareLine}</div>`;
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
 *
 * Emitted as a `<p>`, NOT a `<footer>`: the provenance block is the document's
 * single `<footer>` (contentinfo) landmark; a CV with provenance + license +
 * attribution would otherwise expose three competing footer landmarks, which
 * dilutes the landmark map for screen-reader users (a11y review finding).
 */
export function licenseFooter(cv: CanonicalCv): string {
  const info = licenseInfo(cv.display.cvLicense);
  if (!info) return "";
  const href = safeHref(info.url);
  const name = escapeHtml(info.name);
  const label = href ? `<a href="${escapeHtml(href)}" rel="license">${name}</a>` : name;
  return `<p class="cv-license">${label}</p>`;
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
 *
 * Emitted as a `<p>`, NOT a `<footer>`: the provenance block is the document's
 * single `<footer>` (contentinfo) landmark — see `licenseFooter`. This referral
 * line is a quiet brand backlink, not a second contentinfo region.
 */
export function attributionFooter(cv: CanonicalCv, opts: RenderOpts = {}): string {
  if (!opts.attribution) return "";
  if (cv.display.publicAttribution === false) return "";
  const href = safeHref(SITE_URL);
  // SITE_URL is an https origin from env/fallback, so safeHref always passes; the
  // guard keeps an unexpected non-http value from ever reaching the href.
  /* v8 ignore next -- SITE_URL is always a safe https origin */
  if (!href) return "";
  const s = renderStrings(cv.display.locale);
  // The "living CV" signal: a visible "Updated <date> · updates automatically"
  // line so a visitor (a hiring committee, a collaborator) can see the page is
  // CURRENT — the whole point of a living page, otherwise invisible. Rides the
  // same public-page-only + owner-opt-out gating as the attribution backlink;
  // omitted until the CV has a sync timestamp.
  const synced = formatSyncDate(cv.provenance.lastSyncedAt, cv.display.locale);
  const living = synced
    ? `<p class="cv-living">${escapeHtml(s.livingNote.replace("{date}", synced))}</p>`
    : "";
  const madeWith = escapeHtml(s.madeWith);
  return `${living}<p class="cv-attribution">${madeWith} <a href="${escapeHtml(href)}">SigmaCV</a></p>`;
}

/**
 * The public-page "Co-authors on SigmaCV" block: a short list of the account
 * holder's co-authors who have their OWN published, search-indexable SigmaCV CV,
 * each linking to their public page (`/p/<slug>`). Emitted ONLY when BOTH (a) the
 * caller supplied resolved links (`opts.coauthorCvs` — the `/p/[slug]` route;
 * exporters never do, so it stays off every PDF/DOCX/LaTeX/Markdown) AND (b) the
 * owner opted in (`display.showCoauthorLinks`). "" otherwise.
 *
 * First-party `/p/<slug>` links only (slugs are server-validated upstream); names
 * and slugs are HTML-escaped. A `<nav>` labelled by the heading rather than an
 * `<h2>`, so it never disturbs the CV's section heading outline. "SigmaCV" in the
 * heading is the brand name and is never translated.
 */
export function coauthorLinksFooter(cv: CanonicalCv, opts: RenderOpts = {}): string {
  const links = opts.coauthorCvs ?? [];
  if (links.length === 0 || !cv.display.showCoauthorLinks) return "";
  const heading = escapeHtml(renderStrings(cv.display.locale).coauthorsHeading);
  const items = links
    .map((l) => `<li><a href="${escapeHtml(`/p/${l.slug}`)}">${escapeHtml(l.name)}</a></li>`)
    .join("");
  return `<nav class="cv-coauthors" aria-label="${heading}"><p class="cv-coauthors-h">${heading}</p><ul class="cv-coauthors-list">${items}</ul></nav>`;
}

/** Max number of sections the mascot binds a hat to (CVs never approach this). */
const MASCOT_MAX_SECTIONS = 30;

/**
 * Shared mascot CSS — ONE SigmaCV Σ-logo character that travels down the LEFT
 * gutter WITH the scroll (`scroll(root)`) and SWAPS ITS HAT to match the section
 * the reader is in. Each rendered `section.cv-section` names its own `view()`
 * timeline (`--smN` by `:nth-of-type`); `.cv` hoists them with `timeline-scope`
 * so the single mascot's Nth stacked hat (also by `:nth-of-type`) is driven by the
 * Nth section's timeline — the hat cross-fades as each section enters view. The
 * body is the literal logo (white Σ on the brand-blue square); each style skins
 * `.sm-fig` for its atmosphere (this is only the default + the hats). ALL a11y
 * guards live here: decorative (`aria-hidden` in markup), shown ONLY where
 * scroll-driven animation is supported AND the viewport is wide enough, and HIDDEN
 * under `prefers-reduced-motion`, on narrow viewports, and in print. Motion is
 * transform/opacity only (compositor); it advances only as the visitor scrolls.
 */
export function mascotBaseCss(): string {
  const n = MASCOT_MAX_SECTIONS;
  const scope = Array.from({ length: n }, (_, i) => `--sm${i + 1}`).join(", ");
  const sectionTimelines = Array.from(
    { length: n },
    (_, i) => `  section.cv-section:nth-of-type(${i + 1}) { view-timeline-name: --sm${i + 1}; }`,
  ).join("\n");
  const hatBindings = Array.from(
    { length: n },
    (_, i) =>
      `    .sm-hat:nth-of-type(${i + 1}) { animation: sm-hatswap linear both; animation-timeline: --sm${i + 1}; animation-range: cover 0% cover 100%; }`,
  ).join("\n");
  return `
  body { timeline-scope: ${scope}; }
${sectionTimelines}
  .sm { position: fixed; top: 0; left: max(0.6rem, calc(50vw - 470px)); width: 46px; height: 46px; z-index: 7; pointer-events: none; display: none; }
  .sm, .sm * { box-sizing: border-box; }
  /* Spare decorative layer (a style's skin may use it; transparent by default). */
  .sm-deco { position: absolute; inset: 0; pointer-events: none; }
  /* Hat wrapper — box-identical to .sm-fig so each hat's offsets are unchanged, but
     a SIBLING of it, so a skin's overflow:hidden on .sm-fig never clips the hat. */
  .sm-hats { position: absolute; left: 0; bottom: 0; width: 38px; height: 38px; }
  /* The logo body (default skin; each style overrides .sm-fig for its atmosphere). */
  .sm-fig { position: absolute; left: 0; bottom: 0; width: 38px; height: 38px; border-radius: 12px; background: #1f4fd8;
    box-shadow: 0 5px 13px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.16), 0 0 16px -3px var(--cv-accent, #1f4fd8); }
  .sm-fig::before { content: "\\03A3"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    color: #fff; font: 800 23px/1 ui-sans-serif, system-ui, "Segoe UI", Arial, sans-serif; }
  .sm-fig::after { content: ""; position: absolute; bottom: -3px; left: 10px; width: 6px; height: 5px; border-radius: 0 0 4px 4px;
    background: #1f4fd8; box-shadow: 11px 0 0 #1f4fd8; }

  /* Hats stack at the crown; each is faded by its section's timeline (≈one shown). */
  .sm-hat { position: absolute; left: 50%; top: -10px; transform: translateX(-50%); opacity: 0; }
  /* Default hat — a mortarboard (academic; for any section without a specific hat). */
  .sm-hat { width: 20px; height: 4px; background: #21212e; border-radius: 2px; }
  .sm-hat::before { content: ""; position: absolute; left: 50%; top: -4px; transform: translateX(-50%); width: 10px; height: 5px; background: #21212e; border-radius: 3px 3px 0 0; }
  .sm-hat::after { content: ""; position: absolute; right: 1px; top: 0; width: 2px; height: 8px; background: #e7b34a; }
  /* Grants — a gold coin. */
  .sm-hat--grants { width: 13px; height: 13px; top: -12px; border-radius: 50%; background: radial-gradient(circle at 38% 34%, #ffe08a, #d8a72b 72%); box-shadow: inset 0 0 0 1.5px #b5851f; }
  .sm-hat--grants::before, .sm-hat--grants::after { content: none; }
  /* Talks & conferences — a microphone. */
  .sm-hat--talks, .sm-hat--conference { width: 9px; height: 11px; top: -13px; border-radius: 5px 5px 4px 4px; background: linear-gradient(#3a3a48, #1c1c26); }
  .sm-hat--talks::before, .sm-hat--conference::before { content: ""; position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%); width: 2px; height: 6px; background: #2a2a36; }
  .sm-hat--talks::after, .sm-hat--conference::after { content: none; }
  /* Awards — a gold star. */
  .sm-hat--awards { width: 15px; height: 15px; top: -13px; background: #ffce3a;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
  .sm-hat--awards::before, .sm-hat--awards::after { content: none; }
  /* Datasets & software — goggles. */
  .sm-hat--datasets { width: 8px; height: 8px; top: -10px; border-radius: 50%; background: #cfe6ff; border: 2px solid #2a2a36; box-shadow: 11px 0 0 #cfe6ff, 11px 0 0 2px #2a2a36; }
  .sm-hat--datasets::before, .sm-hat--datasets::after { content: none; }
  /* Patents — a lightbulb. */
  .sm-hat--patents { width: 11px; height: 11px; top: -13px; border-radius: 50% 50% 45% 45%; background: radial-gradient(circle at 40% 35%, #fff6c2, #ffd84d 75%); box-shadow: 0 0 7px #ffd84d80; }
  .sm-hat--patents::before { content: ""; position: absolute; left: 50%; bottom: -3px; transform: translateX(-50%); width: 6px; height: 3px; background: #8a8a96; border-radius: 0 0 2px 2px; }
  .sm-hat--patents::after { content: none; }
  /* Clinical trials — a red medical cross. */
  .sm-hat--clinical-trials { width: 13px; height: 4px; top: -11px; background: #e5484d; border-radius: 1px; }
  .sm-hat--clinical-trials::before { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 4px; height: 13px; background: #e5484d; border-radius: 1px; }
  .sm-hat--clinical-trials::after { content: none; }
  /* Teaching & supervision — an apple. */
  .sm-hat--teaching, .sm-hat--supervision { width: 12px; height: 11px; top: -12px; border-radius: 48% 48% 52% 52%; background: radial-gradient(circle at 35% 32%, #ff7a7a, #d3322e 75%); }
  .sm-hat--teaching::before, .sm-hat--supervision::before { content: ""; position: absolute; left: 52%; top: -3px; width: 2px; height: 4px; background: #6a4a2a; }
  .sm-hat--teaching::after, .sm-hat--supervision::after { content: ""; position: absolute; left: 60%; top: -2px; width: 5px; height: 3px; border-radius: 0 80% 0 80%; background: #4fae54; }
  /* Positions — a hard hat. */
  .sm-hat--positions { width: 16px; height: 7px; top: -10px; border-radius: 8px 8px 0 0; background: linear-gradient(#ffce3a, #e0a91e); }
  .sm-hat--positions::before { content: ""; position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); width: 20px; height: 3px; background: #e0a91e; border-radius: 2px; }
  .sm-hat--positions::after { content: none; }
  /* Editorial — a quill nib. */
  .sm-hat--editorial { width: 4px; height: 14px; top: -13px; background: linear-gradient(#cfd6ea, #6b7390); border-radius: 60% 60% 0 0; transform: translateX(-50%) rotate(18deg); }
  .sm-hat--editorial::before, .sm-hat--editorial::after { content: none; }

  @keyframes sm-travel { from { transform: translateY(8vh); } to { transform: translateY(84vh); } }
  @keyframes sm-hatswap { 0% { opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { opacity: 0; } }
  @supports (animation-timeline: scroll()) {
    .sm { display: block; animation: sm-travel linear both; animation-timeline: scroll(root); }
  }
  @supports (animation-timeline: view()) {
${hatBindings}
  }
  @media (max-width: 1024px) { .sm { display: none !important; } }
  @media (prefers-reduced-motion: reduce) { .sm { display: none !important; } }
  @media print { .sm { display: none !important; } }`;
}

/**
 * SAFE transform of a prose section's USER FREE-TEXT body into HTML.
 *
 * The body is user-controlled data, NOT trusted markup — so everything is
 * HTML-escaped first (see `escapeHtml`), and only a MINIMAL, hand-rolled set of
 * structural affordances is then layered on top of the already-escaped text:
 *  - blank lines split the body into `<p>` paragraphs;
 *  - within a paragraph, runs of lines each beginning with "- " become a `<ul>`
 *    of `<li>` items; non-list lines are joined with `<br>`.
 * Raw HTML and arbitrary markdown are NEVER interpreted — an injected
 * `<script>` / `<img onerror=…>` survives only as inert escaped text. This is
 * the single chokepoint; every renderer that shows a prose body uses it.
 */
export function proseBodyHtml(body: string): string {
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
          `<ul class="cv-prose-list">${listItems
            .map((li) => `<li>${escapeHtml(li)}</li>`)
            .join("")}</ul>`,
        );
        listItems = [];
      };
      let textRun: string[] = [];
      const flushText = () => {
        if (textRun.length === 0) return;
        out.push(`<p>${textRun.map((t) => escapeHtml(t)).join("<br />")}</p>`);
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
 * The sections that will actually render: a PROSE section needs a non-blank body;
 * a standard section needs at least one item. `sectionsHtml` AND the mascot's
 * per-section hats both derive from THIS list, so their order/count stay in
 * lockstep — the mascot's Nth hat is bound (by `:nth-of-type`, in `mascotBaseCss`)
 * to the Nth rendered `section.cv-section`.
 */
function renderableSections(sections: RenderedSection[]): RenderedSection[] {
  return sections.filter((rs) =>
    isProseSectionType(rs.section.type)
      ? (rs.section.body ?? "").trim().length > 0
      : rs.items.length > 0,
  );
}

/**
 * Section list markup (identical across templates; styled via CSS classes).
 * A PROSE section (`PROSE_SECTION_TYPES`) renders its heading + safe-transformed
 * `body` instead of a citation list. A standard section renders its `items` as a
 * numbered bibliography. The section heading + prose body are USER FREE-TEXT and
 * are HTML-escaped / safe-transformed — nothing is interpreted as raw HTML/markdown.
 */
export function sectionsHtml(sections: RenderedSection[]): string {
  return renderableSections(sections)
    .map((rs) => {
      if (isProseSectionType(rs.section.type)) {
        return `<section class="cv-section cv-prose"><h2>${escapeHtml(
          rs.section.title,
        )}</h2><div class="cv-prose-body">${proseBodyHtml(rs.section.body ?? "")}</div></section>`;
      }
      const entries = rs.items
        .map((ri) => `<li><div class="csl-entry">${ri.html}</div></li>`)
        .join("\n");
      return `<section class="cv-section"><h2>${escapeHtml(
        rs.section.title,
      )}</h2><ol class="cv-bib">\n${entries}\n</ol></section>`;
    })
    .join("\n");
}

/**
 * The optional SigmaCV-logo mascot — exactly ONE element per document. A single
 * Σ-logo character travels down the left gutter WITH the scroll (`scroll(root)`)
 * and carries one stacked hat per section; each hat is bound (by `:nth-of-type`,
 * in `mascotBaseCss`) to its section's own `view()` timeline, so the visible hat
 * cross-fades to match whichever section the reader is in — it changes its hat at
 * every section. Decorative + `aria-hidden`, drawn entirely in CSS; each style
 * skins `.sm-fig` to its atmosphere. Must be placed INSIDE `.cv` (which hoists the
 * sections' timelines via `timeline-scope`). Returns "" unless the owner opted in
 * AND the chosen style is mascot-capable — so it never reaches a credible style,
 * and (since exports use the document template) never any export.
 */
export function mascotHtml(cv: CanonicalCv, sections: RenderedSection[]): string {
  if (!cv.display.showMascot || !isMascotStyle(cv.display.publicStyle)) return "";
  const hats = renderableSections(sections)
    .map((rs) => `<i class="sm-hat sm-hat--${rs.section.type}"></i>`)
    .join("");
  // `.sm-deco` is a spare decorative layer each style's skin can use for texture,
  // eyes, scanlines, etc. The hats live in a SIBLING wrapper (`.sm-hats`) — not
  // inside `.sm-fig` — so a skin that clips its body with `overflow:hidden` can't
  // clip the hat (which perches above the body).
  return `<div class="sm" aria-hidden="true"><b class="sm-fig"><u class="sm-deco"></u></b><span class="sm-hats">${hats}</span></div>`;
}
