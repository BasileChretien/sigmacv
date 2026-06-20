/**
 * Public-page showcase style — "Pharmacopoeia".
 *
 * An apothecary monograph / specimen-sheet: warm parchment, a faint hexagonal
 * molecular lattice in the margins, a double-ruled apothecary-label masthead, and
 * monospace tabular detail. The decorative-but-tasteful member of the credible
 * trio — clearly scientific, never costume.
 *
 *   • MOLECULAR LATTICE — a faint sepia honeycomb of benzene-ring hexagons washes
 *     the whole page (inline SVG pattern), like chemistry graph stock.
 *   • APOTHECARY LABEL — the masthead sits under a 3px double rule with a small-
 *     caps Latin eyebrow, and a large faint benzene-ring (⌬) watermark behind the
 *     name.
 *   • HEX MONOGRAPH HEADINGS — each section heading is marked by a small hexagon
 *     bullet in the sepia accent.
 *   • HIGHLIGHTED SELF-NAME — the account holder's own (identifier-matched, never
 *     name-string-matched) name gets a translucent amber highlighter swipe.
 *
 * Palette is a FIXED parchment/sepia/amber identity (NOT account-accent-derived).
 * Motion is RESTRAINED: headings + entries SETTLE in; nothing flickers, no metric
 * is enlarged or coloured for emphasis. Guardrails: ink ~13:1 on parchment, the
 * sepia accent text (#7a4f1d) ~5.2:1, the amber highlighter is a translucent wash
 * UNDER black ink (contrast unaffected); the lattice is ~10% alpha and never sits
 * under text strength. `prefers-reduced-motion` stills all motion; print drops the
 * lattice. CSS-ONLY, light page. Not a mascot style.
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

function pharmacopoeiaCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Warm parchment + dark sepia ink. ink ~13:1, muted ~6:1, faint ~4.9:1 — all AA. */
    --cv-ink:#221c12; --cv-ink-2:#3f3526; --cv-muted:#5f5340; --cv-faint:#6f614c;
    --cv-rule: rgba(34,28,18,0.16); --cv-rule-strong: rgba(34,28,18,0.32); --cv-page:#f7f2e7;
    --ph-paper:#f7f2e7;
    /* Sepia/amber — accent = AA text colour (headings/links/bullets); mark = the
       translucent highlighter wash (sits UNDER ink, so contrast is unaffected);
       lattice = the faint molecular honeycomb. */
    --ph-accent:#7a4f1d; --ph-accent-2:#9c7333;
    --ph-mark: rgba(196,142,46,0.34); --ph-lattice: rgba(122,79,29,0.11);
    --ph-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --ph-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --ph-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--ph-serif); }
  .ph-lattice { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  .cv { position:relative; z-index:1; max-width: 760px; margin:0 auto;
    padding: clamp(48px, 8vw, 92px) clamp(28px, 6vw, 64px) 132px; }

  /* ---- Apothecary-label masthead ---- */
  header.cv-header { position:relative; isolation:isolate; margin-bottom: 2.8rem;
    padding: 1.5rem 0 1.5rem; border-top: 3px double var(--ph-accent);
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header > * { position:relative; z-index:1; }
  header.cv-header::before {
    content:"Materia Academica · Curriculum Vitæ"; display:block; position:relative; z-index:1;
    font-family: var(--ph-sans); font-size:0.66rem; font-weight:600; letter-spacing:0.26em;
    text-transform:uppercase; color: var(--ph-accent); margin-bottom:1rem;
  }
  /* Faint benzene-ring watermark behind the name (left-anchored, never occluded). */
  header.cv-header::after {
    content:"⌬"; position:absolute; top:-0.16em; left:-0.04em; z-index:0; pointer-events:none;
    font-family: var(--ph-serif); line-height:1; font-size: clamp(6rem, 16vw, 10rem);
    color: var(--ph-accent); opacity:0.08;
  }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--ph-serif); font-size: clamp(2.4rem, 6.6vw, 3.9rem); font-weight:500;
    line-height:1.04; letter-spacing:-0.012em; color: var(--cv-ink); margin:0 0 0.5rem;
  }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--ph-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.06rem, 2.5vw, 1.34rem); color: var(--cv-ink-2); margin-top:0.2rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--ph-mono); font-size:0.78rem; letter-spacing:0; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top:0.95rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--ph-accent); text-decoration: underline; text-decoration-color: var(--ph-accent-2);
    text-decoration-thickness:1px; text-underline-offset:0.18em;
  }
  header.cv-header .cv-metrics { font-family: var(--ph-mono); color: var(--cv-muted); }
  .cv-summary { font-size:1.05rem; line-height:1.62; color: var(--cv-ink-2); margin-top:1.5rem; max-width:62ch; }
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong);
    box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(34,28,18,0.45);
    filter: grayscale(0.35) sepia(0.18) contrast(1.02); }

  /* ---- Monograph headings: hexagon bullet ---- */
  section.cv-section { margin-top: 2.8rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.6rem; padding-bottom:0.6rem;
    font-family: var(--ph-sans); font-size:0.8rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.2em; color: var(--ph-accent); margin:0 0 1.1rem;
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:"⬡"; position:absolute; left:0; top:-0.08em; font-size:1rem; line-height:1;
    color: var(--ph-accent-2);
  }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.6rem; right:0; bottom:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.58; font-size:0.98rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--ph-accent-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }
  /* The owner's own name — an amber highlighter swipe (wash UNDER the ink). */
  .cv-self {
    color: var(--cv-ink) !important; font-weight:600; padding:0 0.06em;
    background: linear-gradient(transparent 58%, var(--ph-mark) 58%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.58; color: var(--cv-ink-2); }

  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--ph-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--ph-accent-2); }

  /* ---- Restrained motion ---- */
  @keyframes ph-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes ph-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: ph-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: ph-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: ph-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .ph-lattice { display:none !important; }
    header.cv-header::after { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const pharmacopoeiaTemplate: CvTemplate = {
  key: "pharmacopoeia",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + pharmacopoeiaCss(theme);
    const lattice =
      `<svg class="ph-lattice" aria-hidden="true" focusable="false">` +
      `<defs><pattern id="ph-hex" width="58" height="50" patternUnits="userSpaceOnUse">` +
      `<path d="M48 25 L39 9.4 L21 9.4 L12 25 L21 40.6 L39 40.6 Z" fill="none" stroke="var(--ph-lattice)" stroke-width="1"></path>` +
      `</pattern></defs><rect width="100%" height="100%" fill="url(#ph-hex)"></rect>` +
      `</svg>`;
    const body =
      lattice +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
