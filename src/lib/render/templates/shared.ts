import { isMascotStyle, isProseSectionType, type CanonicalCv } from "@/lib/canonical/schema";
import { licenseInfo } from "@/lib/canonical/license";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "../authorship";
import { renderChartsHtml } from "../charts";
import { displayUrl, escapeHtml, safeHref } from "../escape";
import { formattedMetrics, openAccessShare } from "../metrics";
import { iconSvg, resolveLink, type IconName } from "../icons";
import { SITE_URL } from "@/lib/siteUrl";
import { qrSvg } from "@/lib/cv/qrSvg";
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

/** The contact line: location · email · phone · website (+ extra links). Each item
 *  gains a small decorative icon (the link icon auto-detected from its host) EXCEPT
 *  on the parser-safe ATS template; the visible text is unchanged everywhere. */
function contactHtml(cv: CanonicalCv): string {
  const c = cv.owner.contact ?? {};
  // Icons are decorative inline SVG; suppress them on ATS (a glyph between text runs
  // adds nothing a résumé parser reads and risks tripping it). `ico("")` → "".
  const withIcons = cv.display.template !== "ats";
  const ico = (name: IconName): string => (withIcons ? iconSvg(name) : "");
  const parts: string[] = [];
  if (c.location) parts.push(`${ico("location")}${escapeHtml(c.location)}`);
  if (c.email) {
    const href = safeHref(`mailto:${c.email}`);
    const body = `${ico("email")}${escapeHtml(c.email)}`;
    parts.push(href ? `<a href="${escapeHtml(href)}">${body}</a>` : body);
  }
  if (c.phone) parts.push(`${ico("phone")}${escapeHtml(c.phone)}`);
  if (c.website) {
    // Only render the website when it resolves to a SAFE href; an unsafe scheme
    // (javascript:/data:/…) is dropped entirely rather than shown as raw text.
    const href = safeHref(c.website);
    if (href) {
      // Auto-detect the icon/service the same way profile links do — so a LinkedIn
      // or GitHub URL entered in the Website field still gets its brand mark and a
      // clean "LinkedIn" label, not a bare globe + long URL. A generic site keeps
      // the globe (resolveLink returns "link" for unknown hosts) and its URL text.
      const { icon, service } = resolveLink(c.website);
      const wIcon = icon === "link" ? "website" : icon;
      const label = withIcons && service ? service : displayUrl(c.website);
      parts.push(`<a href="${escapeHtml(href)}"${UGC_REL}>${ico(wIcon)}${escapeHtml(label)}</a>`);
    }
  }
  const links = (cv.owner.links ?? [])
    .map((l) => {
      const href = safeHref(l.url);
      // Detection reads the URL host ONLY (never trusts/mutates it — the href is
      // still safeHref-validated). It picks the icon and, when icons show, an
      // auto-label for a bare URL ("GitHub") — allowlist-gated so a label can't
      // claim a service the URL doesn't point to; ATS keeps the literal URL.
      const { icon, service } = resolveLink(l.url);
      const labelText = l.label || (withIcons ? service : undefined) || l.url;
      if (!labelText && !href) return "";
      // displayUrl strips any user:pass@ userinfo when the label IS the raw URL (an
      // unlabelled link); a plain label/service name passes through unchanged.
      const body = `${ico(icon)}${escapeHtml(displayUrl(labelText))}`;
      return href ? `<a href="${escapeHtml(href)}"${UGC_REL}>${body}</a>` : body;
    })
    .filter(Boolean);
  // Non-ATS templates lay the items out as a responsive grid — one item per line
  // when the header is narrow (e.g. the sidebar column), ~two per line when there
  // is room — each a discrete chip with its leading icon. ATS keeps the
  // parser-safe single " · "-separated line (a real text separator survives the
  // plain-text extraction a résumé parser runs).
  const wrap = (s: string): string => `<span class="cv-citem">${s}</span>`;
  const contactInner = withIcons ? parts.map(wrap).join("") : parts.join(" · ");
  const linksInner = withIcons ? links.map(wrap).join("") : links.join(" · ");
  const contactLine = parts.length ? `<div class="cv-contact">${contactInner}</div>` : "";
  const linksLine = links.length ? `<div class="cv-links">${linksInner}</div>` : "";
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
  .cv-ids a { color: var(--cv-accent); text-decoration: underline; text-underline-offset: 0.15em; }
  /* Contact + profile links: a responsive grid — one item per line in a narrow
     header (e.g. the sidebar column), ~two per line when there is room — each a
     chip with its leading icon. min(100%,…) keeps a single column from
     overflowing a container narrower than the track. */
  .cv-contact, .cv-links { font-size: 0.82rem; color: var(--cv-muted); line-height: 1.5; margin-top: 0.4rem;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 0.25rem 1.25rem; }
  .cv-links { margin-top: 0.25rem; }
  .cv-citem { display: inline-flex; align-items: center; min-width: 0; }
  .cv-citem > a { min-width: 0; overflow-wrap: anywhere; }
  .cv-contact a, .cv-links a { color: var(--cv-muted); text-decoration: underline; text-underline-offset: 0.15em; }
  /* Decorative inline contact/link icons — monochrome via currentColor, so each
     glyph takes the colour of its surrounding text on every template + dark style
     (ORCID is the one exception, rendered in its brand green). Sized to the text,
     nudged onto the baseline, with a thin gap; SVG carries no text-decoration, so
     the link underline applies only to the label text beside it. */
  .cv-ico { width: 1em; height: 1em; vertical-align: -0.125em; margin-right: 0.3em; }
  .cv-summary { margin: 0.95rem 0 0; font-size: 0.95rem; color: var(--cv-ink-2); line-height: 1.55; }
  /* Profile metric strip — ONE METRIC PER LINE (a list, not a " · "-joined run) so
     each metric is a discrete, screen-reader-navigable item, and its interpretation
     anchor + coverage caveat ride as VISIBLE text rather than a mouse-only tooltip.
     Sits below the summary so the reader meets the person before the statistics. */
  ul.cv-metrics { list-style: none; margin: 0.85rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.28rem; font-size: 0.8rem; color: var(--cv-muted); }
  .cv-metric { line-height: 1.45; }
  .cv-metric-label { color: var(--cv-ink-2); font-weight: 600; }
  .cv-metric-value { color: var(--cv-ink-2); font-weight: 600; font-variant-numeric: tabular-nums; }
  /* The metric's interpretation anchor ("1.0 = world average …") and its coverage
     caveat ("mean over N works …"). Upright (not italic — long italic fine-print is
     a readability cost for dyslexia/low-vision), demoted in colour, and always
     VISIBLE (never a tooltip): a responsible-reading caveat should be legible, not
     whispered, and tooltips don't exist in the printed PDF a committee reads. */
  .cv-metric-context { color: var(--cv-muted); }
  .cv-metric-coverage { color: var(--cv-faint); }

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

  /* The publications/year chart and the authorship table are grouped into ONE
     row, sitting side by side when the column is wide enough and wrapping to a
     stack on narrow viewports / print. align-items:flex-start keeps each card at
     its natural height; the cards reset their own top margin inside the row. */
  .cv-research { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 0.9rem; margin-top: 0.9rem; }
  .cv-research > .cv-charts, .cv-research > .cv-authorship { margin-top: 0; }

  /* The research-summary block when the user moves it out of the header into its
     own labelled element (summaryBlockPosition "top"/"bottom"). A <div> (not a
     <section>, to keep the mascot's per-section hat bindings intact) whose <h2>
     joins the heading outline. The heading uses the themed --cv-ink token so it
     stays legible on every template + dark style; its metric list sits directly
     under the heading (no extra top gap). */
  .cv-summary-block { margin-top: var(--cv-space); }
  .cv-summary-block > .cv-summary-h { font-size: 0.95rem; font-weight: 600; color: var(--cv-ink); margin: 0 0 0.65rem; }
  .cv-summary-block .cv-metrics { margin-top: 0; }

  /* The authorship table sits in a guaranteed light card with fixed dark text,
     so it stays legible on EVERY template — including ones with a coloured
     header/sidebar (where themed --cv-ink/--cv-muted could vanish). */
  .cv-authorship { border-collapse: separate; border-spacing: 0; margin-top: 0.9rem; font-size: 0.8rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.45rem 0.85rem 0.5rem; color: #374151; }
  .cv-authorship caption { text-align: left; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; margin-bottom: 0.3rem; }
  .cv-authorship td { padding: 0.14rem 1.1rem 0.14rem 0; color: #374151; }
  .cv-authorship .cv-authorship-n { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #111827; padding-right: 0; }
  .cv-authorship .cv-authorship-pct { margin-left: 0.4rem; font-weight: 400; color: #6b7280; }
  .cv-authorship-note { font-size: 0.7rem; color: var(--cv-faint); margin: 0.3rem 0 0; }
  /* Charts sit in a guaranteed light card so the accent-coloured bars stay
     visible on EVERY template — including ones with a coloured header/sidebar
     (where accent bars would otherwise vanish into an accent background). */
  .cv-charts { display: inline-flex; flex-wrap: wrap; gap: 1.2rem 1.6rem; margin-top: 0.9rem; padding: 0.7rem 0.95rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 100%; }
  .cv-chart { margin: 0; }
  .cv-chart figcaption { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #374151; margin-bottom: 0.25rem; }
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
  /* Opt-in document QR (+ "Live version" URL). On its own white tile and kept pure
     black-on-white + isolated from any template accent so it scans from paper;
     print-color-adjust forces it to print even under "no backgrounds", and the
     module size bumps to ~22mm in print for reliable phone scanning. */
  .cv-qr { display: flex; align-items: center; gap: 0.7rem; margin: 1.4rem 0 0; }
  .cv-qr-img { display: inline-flex; background: #fff; padding: 3px; border-radius: 2px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .cv-qr-img svg { display: block; width: 64px; height: 64px; }
  .cv-qr-cap { display: flex; flex-direction: column; min-width: 0; font-size: 0.66rem; color: var(--cv-faint); letter-spacing: 0.01em; }
  .cv-qr-label { font-weight: 600; }
  .cv-qr-cap a { color: var(--cv-muted); text-decoration: underline; text-underline-offset: 0.15em; overflow-wrap: anywhere; }
  @media print { .cv-qr-img svg { width: 22mm; height: 22mm; } }
  /* "Co-authors on SigmaCV" block — public living page ONLY (opt-in). A quiet
     inline list of collaborators who also have a public SigmaCV CV. */
  .cv-coauthors { margin: 1.4rem 0 0; }
  .cv-coauthors-h { margin: 0 0 0.35rem; font-size: 0.66rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--cv-muted); }
  .cv-coauthors-list { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.2rem 0.85rem; font-size: 0.78rem; }
  .cv-coauthors-list a { color: var(--cv-accent); text-decoration: none; }
  a { color: inherit; }
  /* A visible keyboard-focus ring for every link on the public page + document.
     Uses outline (not box-shadow) so it can't be clipped by an overflow/transform/
     backdrop-filter ancestor on the animated styles, where the UA default ring is
     faint or suppressed. */
  a:focus-visible { outline: 2px solid var(--cv-accent); outline-offset: 2px; border-radius: 2px; }

  /* ── Research areas: a quiet chip row of the owner's most frequent OpenAlex
     fields (opt-in; from owner.researchAreas). Bordered pills (no fill) so they
     read on every template incl. the dark public styles. ─────────────────────── */
  .cv-areas { margin: 0.85rem 0 0; }
  .cv-areas-label { display: block; margin: 0 0 0.35rem; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--cv-muted); }
  ul.cv-areas-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem 0.4rem; }
  .cv-area { font-size: 0.74rem; line-height: 1.4; padding: 0.12em 0.62em; border-radius: 999px; color: var(--cv-ink-2); border: 1px solid var(--cv-rule-strong); }

  /* ── Per-publication tools (public living page only): a no-JS "Cite" disclosure
     (BibTeX/RIS/CSL-JSON downloads), an open-access "Full text" link, and an
     "Abstract" disclosure. Quiet + small; text-indent:0 escapes the bib hanging
     indent (see the badges note). ───────────────────────────────────────────── */
  .cv-itemtools { margin: 0.32rem 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.7rem; font-size: 0.72rem; text-indent: 0; }
  .cv-itemtools details { display: inline; }
  .cv-itemtools summary { display: inline; cursor: pointer; color: var(--cv-muted); list-style: none; -webkit-user-select: none; user-select: none; }
  .cv-itemtools summary::-webkit-details-marker { display: none; }
  .cv-itemtools summary::after { content: " \\25BE"; font-size: 0.85em; }
  .cv-itemtools details[open] summary::after { content: " \\25B4"; }
  .cv-cite-fmts { margin-left: 0.45rem; display: inline-flex; flex-wrap: wrap; gap: 0.1rem 0.6rem; }
  .cv-itemtools a { color: var(--cv-accent); text-decoration: none; }
  .cv-itemtools a:hover { text-decoration: underline; }
  .cv-fulltext::before { content: "\\2197 "; }
  .cv-abstract { flex-basis: 100%; }
  /* The expanded abstract is a clearly CONTAINED callout card, so a long abstract
     reads as a distinct block rather than a wall of text spilling down the left of
     the entry: an accent-coloured left edge, a faint neutral panel (works on light +
     dark styles), padding all round and rounded corners. text-indent:0 defends
     against the bibliography's inherited negative (hanging-indent) text-indent. */
  .cv-abstract > p { margin: 0.5rem 0 0.2rem; padding: 0.6em 0.9em; border-inline-start: 3px solid var(--cv-accent); background: rgba(127, 127, 127, 0.1); border-radius: 0 7px 7px 0; font-size: 0.8rem; line-height: 1.55; color: var(--cv-ink-2); max-width: 72ch; text-indent: 0; }
  /* COinS reference-manager metadata spans are invisible (the Zotero connector reads
     them from the DOM regardless); display:none also keeps the empty span out of the
     .cv-itemtools flex flow so it adds no leading gap before "Cite". */
  .Z3988 { display: none; }

  /* Featured / "Selected" star badge — a fixed light pill (like the OA/cites
     badges) so it stays legible on every template. */
  .cv-badge-featured { color: #92600a; background: #fdf3d6; border: 1px solid #f0d488; }

  /* ── View filter bar (public living page only): server-rendered facet chips
     (year ranges + open-access) that set query params on the same page. ──────── */
  .cv-filterbar { margin: 0 0 1.1rem; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3rem 0.45rem; font-size: 0.76rem; }
  .cv-filter-label { font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--cv-muted); margin-right: 0.15rem; }
  .cv-filterbar a { color: var(--cv-ink-2); text-decoration: none; padding: 0.12em 0.62em; border-radius: 999px; border: 1px solid var(--cv-rule-strong); }
  .cv-filterbar a:hover { border-color: var(--cv-accent); color: var(--cv-accent); }
  .cv-filterbar a[aria-current="true"] { background: var(--cv-accent); color: #fff; border-color: var(--cv-accent); }

  /* Public-page "Subscribe" (Atom/RSS) affordance — a quiet footnote near the living
     line. A no-JS <details>: the summary is the "Subscribe" toggle; opening it reveals
     the feed URL to paste into a reader (browsers can't natively subscribe to a feed). */
  .cv-subscribe { margin: 0.3rem 0 0; font-size: 0.66rem; color: var(--cv-muted); letter-spacing: 0.01em; }
  .cv-subscribe summary { display: inline; cursor: pointer; color: var(--cv-accent); list-style: none; -webkit-user-select: none; user-select: none; }
  .cv-subscribe summary::-webkit-details-marker { display: none; }
  .cv-subscribe summary::after { content: " \\25BE"; font-size: 0.85em; }
  .cv-subscribe[open] summary::after { content: " \\25B4"; }
  .cv-subscribe-how { display: block; margin-top: 0.25rem; }
  /* The feed URL: a link (so a feed-reader extension can handle a click) that is also
     one-click-selectable for copy-paste into a reader. */
  .cv-subscribe-url { color: var(--cv-accent); text-decoration: underline; text-underline-offset: 0.15em; word-break: break-all; -webkit-user-select: all; user-select: all; }

  @page { size: A4; margin: 16mm 15mm; }
  @media print {
    .cv { padding: 0; max-width: none; }
    a { text-decoration: none; }
    /* Keep in-text profile / contact / ID links underlined in the PDF so the
       link affordance survives print (WCAG 1.4.1 — not signalled by colour). */
    .cv-ids a, .cv-contact a, .cv-links a { text-decoration: underline; text-underline-offset: 0.15em; }
    .cv-ror-link { border-bottom: none; }
    /* Interactive web-only affordances never belong in the printed/PDF CV. */
    .cv-itemtools, .cv-filterbar, .cv-subscribe { display: none !important; }
    section.cv-section { break-inside: auto; }
    section.cv-section > h2 { break-after: avoid; break-inside: avoid; }
    ol.cv-bib > li { break-inside: avoid; }
    header.cv-header { break-inside: avoid; break-after: avoid; }
    .cv-chart, figure.cv-chart, .cv-authorship { break-inside: avoid; }
  }

  /* Phones: stack the header so the NAME leads instead of being squeezed beside
     the photo, and tighten the page gutter (the 52px desktop padding eats ~a
     third of a 375px screen). The head text (name) is emitted before the optional
     photo, so plain column keeps the name on top; showcase styles with their own
     card (.cv padding:0) override the padding, but the header stack still applies. */
  @media (max-width: 560px) {
    .cv { padding: 28px 22px; }
    .cv-headmain { flex-direction: column; align-items: flex-start; gap: 0.9rem; }
    .cv-photo { width: 88px; height: 88px; }
  }`;
}

/**
 * The aggregated "Research areas" chip row — the owner's most frequent OpenAlex
 * topic FIELDS (`owner.researchAreas`), shown only when the owner opts in
 * (`display.showResearchAreas`) and the aggregate is non-empty. Field names are
 * HTML-escaped and ordered most-frequent-first (as computed at build). "" otherwise.
 */
function researchAreasHtml(cv: CanonicalCv): string {
  if (!cv.display.showResearchAreas) return "";
  const areas = cv.owner.researchAreas ?? [];
  if (areas.length === 0) return "";
  const label = escapeHtml(renderStrings(cv.display.locale).researchAreasLabel);
  const chips = areas.map((a) => `<li class="cv-area">${escapeHtml(a.field)}</li>`).join("");
  return `<div class="cv-areas"><span class="cv-areas-label">${label}</span><ul class="cv-areas-list">${chips}</ul></div>`;
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
  // The ORCID iD line leads with the green iD icon (its brand guidelines call for it),
  // suppressed on the parser-safe ATS template like the other contact icons. The icon
  // is decorative (aria-hidden); the "ORCID:" text keeps the accessible label.
  const orcidIco = orcid && cv.display.template !== "ats" ? iconSvg("orcid") : "";
  const ids = orcid
    ? `<div class="cv-ids">${orcidIco}ORCID: <a href="https://orcid.org/${orcid}">${orcid}</a></div>`
    : "";
  const summary = cv.owner.summary
    ? `<p class="cv-summary">${escapeHtml(cv.owner.summary)}</p>`
    : "";
  const photo = opts.photo ? photoHtml(cv) : "";
  // The research-summary block (metric strip + grouped chart/authorship cards)
  // renders INSIDE the header only in the default "header" position — with no
  // heading, exactly as before, so existing CVs are byte-identical. "top"/"bottom"
  // relocate it to its own labelled block in <main> (researchSummaryBlock, placed by
  // sectionsHtmlRaw); "hidden" suppresses it. The narrative SUMMARY still leads the
  // header body so the reader meets the person before any statistics.
  const block = cv.display.summaryBlockPosition === "header" ? researchSummaryBody(cv) : "";
  // Research-area chips sit just under the summary (person → their fields →
  // statistics), opt-in and "" when off. They describe the person (not the metrics),
  // so they stay in the header regardless of the research-summary block's placement.
  const areas = researchAreasHtml(cv);
  const text = `<div class="cv-headtext"><h1>${honorific}${name}</h1>${headline}${ids}${contactHtml(cv)}</div>`;
  return `<header class="cv-header"><div class="cv-headmain">${text}${photo}</div>${summary}${areas}${block}</header>`;
}

/**
 * The research-summary block BODY: the one-per-line metric list followed by the
 * grouped publications/year chart + authorship-table row. ONE METRIC PER LINE for
 * reading clarity (a " · "-joined run wraps mid-caveat into one blob); the
 * open-access share leads as a labelled row; each metric carries its interpretation
 * ANCHOR and coverage caveat as VISIBLE text (the caveat used to hide in a hover
 * title — unreachable by keyboard/touch and absent in the printed PDF a committee
 * reads). Pure; "" when there is nothing to show. Shared by both placements — inline
 * in the header ("header") and inside the standalone labelled block ("top"/"bottom").
 */
export function researchSummaryBody(cv: CanonicalCv): string {
  const oaShare = openAccessShare(cv);
  const rows: string[] = [];
  if (oaShare) {
    const pct = new Intl.NumberFormat(cv.display.locale, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(oaShare.pct / 100);
    rows.push(
      `<li class="cv-metric cv-metric-oa"><span class="cv-metric-label">${escapeHtml(
        renderStrings(cv.display.locale).openAccessLabel,
      )}</span> <span class="cv-metric-value">${escapeHtml(pct)}</span></li>`,
    );
  }
  for (const m of formattedMetrics(cv)) {
    const context = m.context
      ? ` <span class="cv-metric-context">— ${escapeHtml(m.context)}</span>`
      : "";
    const coverage = m.coverageNote
      ? ` <span class="cv-metric-coverage">· ${escapeHtml(m.coverageNote)}</span>`
      : "";
    rows.push(
      `<li class="cv-metric"><span class="cv-metric-label">${escapeHtml(
        m.label,
      )}</span> <span class="cv-metric-value">${escapeHtml(m.value)}</span>${context}${coverage}</li>`,
    );
  }
  const metricsLine = rows.length ? `<ul class="cv-metrics">${rows.join("")}</ul>` : "";
  const charts = renderChartsHtml(cv);
  const authorship = authorshipTableHtml(cv);
  const research =
    charts || authorship ? `<div class="cv-research">${charts}${authorship}</div>` : "";
  return `${metricsLine}${research}`;
}

/**
 * The research-summary block as its OWN labelled element, for the "top"/"bottom"
 * placements. A `<div>` (deliberately NOT a `<section>`: the mascot binds its hats
 * by `section.cv-section:nth-of-type(N)`, so an extra `<section>` would desync the
 * hat order on the animated styles) carrying an `<h2>` so the block joins the
 * heading outline and leaves the `banner` landmark. The heading is the user's
 * `display.summaryHeading` or a localized default, and uses the themed `--cv-ink`
 * token so it stays legible on every template + dark style. "" unless the block is
 * body-placed AND has content.
 */
export function researchSummaryBlock(cv: CanonicalCv): string {
  const pos = cv.display.summaryBlockPosition;
  if (pos !== "top" && pos !== "bottom") return "";
  const body = researchSummaryBody(cv);
  if (!body) return "";
  const heading = escapeHtml(
    cv.display.summaryHeading?.trim() || renderStrings(cv.display.locale).researchSummaryHeading,
  );
  return `<div class="cv-summary-block"><h2 class="cv-summary-h">${heading}</h2>${body}</div>`;
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
  // "Subscribe" affordance for this living CV's Atom feed (the public follow
  // primitive). A browser can't natively "subscribe" to a feed — clicking a bare
  // feed.xml link just shows raw XML — so this is a no-JS <details> disclosure: the
  // summary toggles open to reveal the feed URL to paste into a reader (the URL is
  // also a link, for readers that handle feed clicks via an extension). Shown only
  // when the route supplied a feed href (`opts.feedHref`).
  const subscribe = opts.feedHref
    ? `<details class="cv-subscribe"><summary>${escapeHtml(s.subscribeLabel)}</summary>` +
      `<span class="cv-subscribe-how">${escapeHtml(s.subscribeHint)} ` +
      `<a class="cv-subscribe-url" href="${escapeHtml(opts.feedHref)}">${escapeHtml(
        opts.feedHref,
      )}</a></span></details>`
    : "";
  return `${living}${subscribe}<p class="cv-attribution">${madeWith} <a href="${escapeHtml(href)}">SigmaCV</a></p>`;
}

/**
 * Opt-in DOCUMENT QR — a small QR + a "Live version" text link to this CV's public
 * living page, in the footer of the exported document (and the document HTML/PDF).
 * Emitted only when BOTH (a) the caller supplied the published page URL
 * (`opts.publicPageUrl` — the export + preview routes set it only when the page is
 * actually published; the public `/p/[slug]` route never does, so a live page never
 * QRs itself) AND (b) the owner opted in (`display.showDocQr`). NEVER on the
 * parser-safe ATS template (an opaque image confuses résumé parsers).
 *
 * The QR is decorative (`aria-hidden`): the human-readable URL beside it is the
 * real link, so it works for screen-reader users and on screen (where nobody scans
 * a code). Encodes only the public URL. Emitted as a `<div>`, NOT a `<footer>` —
 * the provenance block is the document's single contentinfo landmark.
 */
export function docQrFooter(cv: CanonicalCv, opts: RenderOpts = {}): string {
  const url = opts.publicPageUrl;
  if (!url || !cv.display.showDocQr || cv.display.template === "ats") return "";
  const href = safeHref(url);
  /* v8 ignore next -- publicPageUrl is always a safe absoluteUrl() https origin */
  if (!href) return "";
  const s = renderStrings(cv.display.locale);
  return (
    `<div class="cv-qr">` +
    `<span class="cv-qr-img" aria-hidden="true">${qrSvg(url)}</span>` +
    `<span class="cv-qr-cap"><span class="cv-qr-label">${escapeHtml(s.liveVersionLabel)}</span>` +
    `<a href="${escapeHtml(href)}">${escapeHtml(displayUrl(url))}</a></span>` +
    `</div>`
  );
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
  return `<nav class="cv-coauthors" aria-labelledby="cv-coauthors-h"><h2 id="cv-coauthors-h" class="cv-coauthors-h">${heading}</h2><ul class="cv-coauthors-list">${items}</ul></nav>`;
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
  /* Spare decorative layer (a style's skin may use it; transparent by default).
     z-index:1 keeps a skin's body texture ABOVE the body fill but BELOW the Σ. */
  .sm-deco { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
  /* Hat anchor — a zero-height line at the body's CROWN (38px above .sm's base),
     a SIBLING of .sm-fig so a skin's overflow:hidden on the body never clips the
     hat, and bottom-anchored so every hat sits ON the head (worn), not floating. */
  .sm-hats { position: absolute; left: 0; bottom: 38px; width: 38px; height: 0; }
  /* The logo body (default skin; each style overrides .sm-fig for its atmosphere). */
  .sm-fig { position: absolute; left: 0; bottom: 0; width: 38px; height: 38px; border-radius: 12px; background: #1f4fd8; isolation: isolate;
    box-shadow: 0 5px 13px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.16), 0 0 16px -3px var(--cv-accent, #1f4fd8); }
  .sm-fig::before { content: "\\03A3"; position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center;
    color: #fff; font: 800 23px/1 ui-sans-serif, system-ui, "Segoe UI", Arial, sans-serif; }
  .sm-fig::after { content: ""; position: absolute; bottom: -3px; left: 10px; width: 6px; height: 5px; border-radius: 0 0 4px 4px;
    background: #1f4fd8; box-shadow: 11px 0 0 #1f4fd8; }

  /* Hats sit ON the crown (bottom-anchored to .sm-hats, growing upward), each
     faded in by its section's timeline (≈one shown at a time). */
  .sm-hat { position: absolute; left: 50%; bottom: -1px; transform: translateX(-50%); opacity: 0; }
  /* Default hat — a mortarboard (academic; for any section without a specific hat). */
  .sm-hat { width: 20px; height: 4px; background: #21212e; border-radius: 2px; }
  .sm-hat::before { content: ""; position: absolute; left: 50%; top: -4px; transform: translateX(-50%); width: 10px; height: 5px; background: #21212e; border-radius: 3px 3px 0 0; }
  .sm-hat::after { content: ""; position: absolute; right: 1px; top: 0; width: 2px; height: 8px; background: #e7b34a; }
  /* Grants — a gold coin. */
  .sm-hat--grants { width: 13px; height: 13px; border-radius: 50%; background: radial-gradient(circle at 38% 34%, #ffe08a, #d8a72b 72%); box-shadow: inset 0 0 0 1.5px #b5851f; }
  .sm-hat--grants::before, .sm-hat--grants::after { content: none; }
  /* Talks & conferences — a microphone. */
  .sm-hat--talks, .sm-hat--conference { width: 9px; height: 11px; border-radius: 5px 5px 4px 4px; background: linear-gradient(#3a3a48, #1c1c26); }
  .sm-hat--talks::before, .sm-hat--conference::before { content: ""; position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%); width: 2px; height: 6px; background: #2a2a36; }
  .sm-hat--talks::after, .sm-hat--conference::after { content: none; }
  /* Awards — a gold star. */
  .sm-hat--awards { width: 15px; height: 15px; background: #ffce3a;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
  .sm-hat--awards::before, .sm-hat--awards::after { content: none; }
  /* Datasets & software — goggles. */
  .sm-hat--datasets { width: 8px; height: 8px; border-radius: 50%; background: #cfe6ff; border: 2px solid #2a2a36; box-shadow: 11px 0 0 #cfe6ff, 11px 0 0 2px #2a2a36; }
  .sm-hat--datasets::before, .sm-hat--datasets::after { content: none; }
  /* Patents — a lightbulb. */
  .sm-hat--patents { width: 11px; height: 11px; border-radius: 50% 50% 45% 45%; background: radial-gradient(circle at 40% 35%, #fff6c2, #ffd84d 75%); box-shadow: 0 0 7px #ffd84d80; }
  .sm-hat--patents::before { content: ""; position: absolute; left: 50%; bottom: -3px; transform: translateX(-50%); width: 6px; height: 3px; background: #8a8a96; border-radius: 0 0 2px 2px; }
  .sm-hat--patents::after { content: none; }
  /* Clinical trials — a red medical cross. */
  .sm-hat--clinical-trials { width: 13px; height: 4px; background: #e5484d; border-radius: 1px; }
  .sm-hat--clinical-trials::before { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 4px; height: 13px; background: #e5484d; border-radius: 1px; }
  .sm-hat--clinical-trials::after { content: none; }
  /* Teaching & supervision — an apple. */
  .sm-hat--teaching, .sm-hat--supervision { width: 12px; height: 11px; border-radius: 48% 48% 52% 52%; background: radial-gradient(circle at 35% 32%, #ff7a7a, #d3322e 75%); }
  .sm-hat--teaching::before, .sm-hat--supervision::before { content: ""; position: absolute; left: 52%; top: -3px; width: 2px; height: 4px; background: #6a4a2a; }
  .sm-hat--teaching::after, .sm-hat--supervision::after { content: ""; position: absolute; left: 60%; top: -2px; width: 5px; height: 3px; border-radius: 0 80% 0 80%; background: #4fae54; }
  /* Positions — a hard hat. */
  .sm-hat--positions { width: 16px; height: 7px; border-radius: 8px 8px 0 0; background: linear-gradient(#ffce3a, #e0a91e); }
  .sm-hat--positions::before { content: ""; position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); width: 20px; height: 3px; background: #e0a91e; border-radius: 2px; }
  .sm-hat--positions::after { content: none; }
  /* Editorial — a quill nib. */
  .sm-hat--editorial { width: 4px; height: 14px; background: linear-gradient(#cfd6ea, #6b7390); border-radius: 60% 60% 0 0; transform: translateX(-50%) rotate(18deg); }
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
/**
 * The section list WITHOUT the `<main>` landmark — for a template that supplies
 * its own `<main>` (the Sidebar two-column layout wraps sections + footers in one
 * `<main class="cv-main">`). Everything else should use `sectionsHtml`.
 */
export function sectionsHtmlRaw(cv: CanonicalCv, sections: RenderedSection[]): string {
  const body = renderableSections(sections)
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
  // The research-summary block, when the user moved it out of the header, renders
  // here as its own labelled element — FIRST ("top") or LAST ("bottom") in <main>,
  // so the DOM (reading) order matches the visual order (WCAG 1.3.2). "" otherwise.
  const block = researchSummaryBlock(cv);
  if (!block) return body;
  return cv.display.summaryBlockPosition === "bottom" ? `${body}\n${block}` : `${block}\n${body}`;
}

/**
 * The CV's sections wrapped in the `<main>` landmark (WCAG 1.3.1 / 2.4.1) — the
 * primary-content region every template/style except Sidebar uses. No style
 * relies on sections being direct children of `.cv`, so the wrapper is layout-
 * neutral; `.cv-main` carries no shared styling (only Sidebar styles its own).
 */
export function sectionsHtml(cv: CanonicalCv, sections: RenderedSection[]): string {
  return `<main class="cv-main">${sectionsHtmlRaw(cv, sections)}</main>`;
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
