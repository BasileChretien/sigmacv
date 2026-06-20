/**
 * Public-page showcase style — "Atelier".
 *
 * A field-tuned credible style for the ARTS, DESIGN and ARCHITECTURE, rendered as
 * a LIT EXHIBITION. Bright gallery stock under a soft overhead spotlight, an
 * oversized display name on an engraved brass plaque, a museum-matted portrait,
 * and a wall of plate-numbered labels. Foregrounds the person and the work as a
 * curated wall, built to look complete from a hand-curated record (these fields
 * have almost no open data source).
 *
 *   • SPOTLIGHT — a soft warm gallery light washes down from above the hero
 *     (decorative).
 *   • BRASS PLAQUE — the eyebrow is set as an engraved brass nameplate; the
 *     portrait is museum-matted.
 *   • WALL LABELS — each entry is a plate-numbered wall label (Pl. 01 …) with a
 *     clay marker and a quiet lift on hover, hung beneath a picture rail.
 *   • GALLERY LABELS — section headings are small, wide-tracked clay labels over a
 *     thin top rule, with generous space.
 *   • CAPTIONED SELF-NAME — your own (identifier-matched, never name-string-
 *     matched) name is set in clay with a fine underline.
 *
 * Palette is a FIXED gallery-white / ink / clay identity (NOT account-accent-
 * derived). Motion is RESTRAINED. Guardrails: ink ~15:1; clay accent text
 * (#a04e38) ~4.7:1; the spotlight is a low-alpha wash. `prefers-reduced-motion`
 * stills motion; print is plain. CSS-ONLY, light page. Not a mascot style.
 */
import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";

function atelierCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cv-ink:#1b1a18; --cv-ink-2:#3a3733; --cv-muted:#5f5a52; --cv-faint:#726c62;
    --cv-rule: rgba(27,26,24,0.14); --cv-rule-strong: rgba(27,26,24,0.26); --cv-page:#fcfbf9;
    --at-accent-ink:#a04e38; --at-accent:#b5563a;
    --at-brass1:#c9b27a; --at-brass2:#9c8246;
    --at-serif: ui-serif, "Hoefler Text", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    --at-sans: ui-sans-serif, system-ui, "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--at-serif); }
  /* Soft overhead gallery spotlight behind the hero. */
  .at-spot { position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(60% 42% at 38% -6%, rgba(255,247,232,0.85), rgba(255,247,232,0) 70%),
                radial-gradient(40% 30% at 50% 0%, rgba(181,86,58,0.05), transparent 72%); }
  .cv { position:relative; z-index:1; max-width: 840px; margin:0 auto;
    padding: clamp(56px, 10vw, 120px) clamp(28px, 7vw, 88px) 150px; }

  /* ---- Portfolio hero ---- */
  header.cv-header { position:relative; margin-bottom: 4rem; }
  /* Engraved brass plaque eyebrow. */
  header.cv-header::before {
    content:"Selected Work · Curriculum Vitæ"; display:inline-block; font-family: var(--at-sans);
    font-size:0.64rem; font-weight:600; letter-spacing:0.3em; text-transform:uppercase;
    color:#4a3c18; margin-bottom:1.5rem; padding:0.34em 0.8em; border-radius:2px;
    background: linear-gradient(180deg, var(--at-brass1), var(--at-brass2));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12);
    text-shadow: 0 1px 0 rgba(255,255,255,0.3); }
  .cv-headmain { gap: 2.6rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--at-serif); font-size: clamp(3rem, 9.5vw, 5.4rem); font-weight:500;
    line-height:0.98; letter-spacing:-0.022em; color: var(--cv-ink); margin:0 0 0.6rem; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--at-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.15rem, 2.8vw, 1.55rem); color: var(--cv-ink-2); margin-top:0.3rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--at-sans); font-size:0.8rem; letter-spacing:0.04em; color: var(--cv-muted); }
  header.cv-header .cv-ids { margin-top:1.1rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--at-accent);
    text-decoration-thickness:1px; text-underline-offset:0.2em; }
  header.cv-header .cv-metrics { font-family: var(--at-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.1rem; line-height:1.66; color: var(--cv-ink-2); margin-top:1.7rem; max-width:58ch; }
  /* Museum-mount portrait: wide white mat + hairline frame + brass tag below. */
  .cv-photo { width:150px; height:188px; border-radius:1px; object-fit:cover;
    border:8px solid #ffffff; outline:1px solid var(--cv-rule-strong); outline-offset:-9px;
    box-shadow: 0 22px 44px -26px rgba(27,26,24,0.55); }

  /* ---- Gallery-label sections (top rule + clay label, much air) ---- */
  section.cv-section { margin-top: 3.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-top:1rem; margin:0 0 1.4rem;
    font-family: var(--at-sans); font-size:0.72rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.26em; color: var(--at-accent-ink); }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; right:0; top:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%; }

  /* ---- Entries as plate-numbered wall labels ---- */
  ol.cv-bib { counter-reset: plate; }
  ol.cv-bib > li { counter-increment: plate; position:relative;
    margin-bottom:1.15rem; padding:0.65rem 0.2rem 0.65rem 3.4rem; line-height:1.6; font-size:0.99rem;
    color: var(--cv-ink-2); border-bottom:1px solid var(--cv-rule); transition: transform .18s ease, background .18s ease; }
  ol.cv-bib > li::before { content:"Pl. " counter(plate, decimal-leading-zero); position:absolute;
    left:0; top:0.7rem; font-family: var(--at-sans); font-size:0.62rem; font-weight:600; letter-spacing:0.12em;
    color: var(--at-accent-ink); }
  ol.cv-bib > li::after { content:""; position:absolute; left:2.5rem; top:0.85rem; bottom:0.85rem; width:2px;
    background: var(--at-accent); opacity:0.5; }
  ol.cv-bib > li:hover { transform: translateY(-2px); background: rgba(181,86,58,0.035); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--at-accent);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  .cv-self {
    color: var(--at-accent-ink) !important; font-weight:600; letter-spacing:0.01em; padding-bottom:0.05em;
    background-image: linear-gradient(var(--at-accent), var(--at-accent));
    background-size:100% 1px; background-position:0 100%; background-repeat:no-repeat; }

  .cv-prose-body p { font-size:1.02rem; line-height:1.66; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.62; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--at-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--at-accent); }

  /* ---- Restrained motion ---- */
  @keyframes at-settle { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
  @keyframes at-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: at-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
      animation: at-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%; }
    ol.cv-bib > li {
      animation: at-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%; }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before { transform:none !important; }
  }
  @media print {
    .at-spot { display:none !important; }
    ol.cv-bib > li::after { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const atelierTemplate: CvTemplate = {
  key: "atelier",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + atelierCss(theme);
    const body =
      `<div class="at-spot" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
