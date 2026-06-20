/**
 * Public-page showcase style — "Hanko".
 *
 * A Franco-Japanese editorial style: warm washi paper, sumi-ink typography, and
 * generous ma (negative space), with a single vermilion accent — the hanko (印),
 * a personal name-seal. It nods to the owner's Caen + Nagoya life as a design
 * language rather than as decoration.
 *
 *   • NAME, SEALED — the owner's name in the masthead is stamped with a small
 *     solid-vermilion seal (a hand-stamped tilt) right after it: a hanko marks
 *     your name, which is exactly what this style does.
 *   • TOKONOMA SCROLL-RULE — a thin sumi vertical line in the left gutter, capped
 *     by a vermilion seal-diamond like a hanging scroll's roller. Decorative +
 *     aria-hidden; hides on narrow viewports / print.
 *   • SUMI DIVIDERS — each section heading carries a small vermilion seal-tick and
 *     a brush-tapered ink underline that lifts (fades) at its end, like a stroke.
 *   • SIGNED SELF-NAME — the account holder's own (identifier-matched, never
 *     name-string-matched) name is sumi-bold under a fine vermilion brush rule.
 *
 * Palette is a FIXED washi/sumi/vermilion identity (NOT account-accent-derived).
 * Motion is RESTRAINED: headings + entries SETTLE in (small fade + rise) and the
 * sumi underline brushes in; nothing flickers, no metric is enlarged or coloured
 * for emphasis. Guardrails: sumi ink ~14:1 on the washi page; the vermilion ink
 * (#9e2b1e) used for any text is ~5.5:1; the bright seal vermilion (#b7352b) is
 * used only as a solid fill behind paper-coloured glyphs / as decoration, never
 * as small text on the page. `prefers-reduced-motion` stills all motion; print
 * drops the scroll-rule. CSS-ONLY, light page — reads credibly to a hiring
 * committee. Not a mascot style; the seal is the character.
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

function hankoCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Warm washi paper + sumi ink. ink ~14:1, muted ~6.2:1, faint ~5:1 — all AA. */
    --cv-ink:#1f1d1a; --cv-ink-2:#3a3631; --cv-muted:#5f594f; --cv-faint:#71695e;
    --cv-rule: rgba(31,29,26,0.16); --cv-rule-strong: rgba(31,29,26,0.30); --cv-page:#f7f4ec;
    --hk-paper:#f7f4ec;
    /* Vermilion (朱) — the seal. seal = bright fill behind paper glyphs / decoration;
       seal-ink = the deep cinnabar used wherever vermilion becomes small text. */
    --hk-seal:#b7352b; --hk-seal-ink:#9e2b1e;
    --hk-rule: rgba(31,29,26,0.5);
    --hk-serif: ui-serif, "Hiragino Mincho ProN", "Yu Mincho", Georgia, "Times New Roman", serif;
    --hk-sans: ui-sans-serif, system-ui, "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--hk-serif); }
  .cv { position:relative; z-index:1; max-width: 720px; margin:0 auto;
    padding: clamp(52px, 9vw, 104px) clamp(28px, 7vw, 76px) 140px; }

  /* ---- Tokonoma scroll-rule (left gutter), capped by a vermilion seal-diamond ---- */
  .hk-scroll { position:fixed; left: clamp(12px, 4.5vw, 56px); top:9vh; bottom:9vh; width:2px;
    z-index:0; pointer-events:none; background: linear-gradient(var(--hk-rule), transparent 92%); }
  .hk-scroll::before { content:""; position:absolute; top:-9px; left:-5px; width:12px; height:12px;
    background: var(--hk-seal); border-radius:2px; transform: rotate(45deg); }
  @media (max-width: 1024px) { .hk-scroll { display:none; } }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; margin-bottom: 3rem; padding-bottom: 2rem;
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; font-family: var(--hk-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.32em; text-transform:uppercase;
    color: var(--hk-seal-ink); margin-bottom:1.4rem;
  }
  .cv-headmain { gap: 2.2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--hk-serif); font-size: clamp(2.3rem, 6.4vw, 3.8rem); font-weight:500;
    line-height:1.1; letter-spacing:0.005em; color: var(--cv-ink); margin:0 0 0.55rem;
  }
  /* The hanko: a small solid-vermilion seal stamped just after the name. */
  header.cv-header h1::after {
    content:"Σ"; display:inline-grid; place-items:center; vertical-align:0.14em;
    width:1.5em; height:1.5em; margin-left:0.4em; font-size:0.4em; font-weight:700;
    background: var(--hk-seal); color: var(--hk-paper); border-radius:0.14em; transform: rotate(-5deg);
  }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--hk-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.04rem, 2.4vw, 1.3rem); color: var(--cv-ink-2); margin-top:0.3rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--hk-sans); font-size:0.8rem; letter-spacing:0.01em; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top:1rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--hk-seal);
    text-decoration-thickness:1px; text-underline-offset:0.18em;
  }
  header.cv-header .cv-metrics { font-family: var(--hk-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.05rem; line-height:1.66; color: var(--cv-ink-2); margin-top:1.6rem; max-width:60ch; }
  /* Washi-framed portrait. */
  .cv-photo { width:118px; height:148px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong);
    box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(31,29,26,0.5);
    filter: grayscale(0.4) contrast(1.02); }

  /* ---- Sections: vermilion seal-tick + brush-tapered sumi underline ---- */
  section.cv-section { margin-top: 3rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.5rem; padding-bottom:0.7rem;
    font-family: var(--hk-sans); font-size:0.78rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.22em; color: var(--cv-ink); margin:0 0 1.2rem;
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:0.08em; width:0.55rem; height:0.55rem;
    background: var(--hk-seal); border-radius:1px; transform: rotate(45deg);
  }
  /* The sumi rule fades at its end like a lifted brush. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.5rem; right:0; bottom:0; height:1.5px; transform-origin:0 50%;
    background: linear-gradient(90deg, var(--cv-ink) 0, var(--cv-ink) 56%, transparent 100%);
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:0.98rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--hk-seal);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }
  /* The owner's own name — sumi-bold, signed under a fine vermilion brush rule. */
  .cv-self {
    color: var(--cv-ink) !important; font-weight:600; letter-spacing:0.01em; padding-bottom:0.06em;
    background-image: linear-gradient(var(--hk-seal), var(--hk-seal));
    background-size:100% 1.5px; background-position:0 100%; background-repeat:no-repeat;
  }

  .cv-prose-body p { font-size:1.0rem; line-height:1.66; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.6; color: var(--cv-ink-2); }

  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--hk-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--hk-seal); }

  /* ---- Restrained motion ---- */
  @keyframes hk-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes hk-brush { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: hk-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: hk-brush cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: hk-settle cubic-bezier(0.22,1,0.36,1) both;
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
    .hk-scroll { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const hankoTemplate: CvTemplate = {
  key: "hanko",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + hankoCss(theme);
    const body =
      `<div class="hk-scroll" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
