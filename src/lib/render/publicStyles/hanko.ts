/**
 * Public-page showcase style — "Hanko".
 *
 * A Franco-Japanese editorial style rendered as a HANGING SCROLL (kakemono).
 * Warm washi paper with faint fibre texture, soft sumi-e ink-wash clouds drifting
 * in the margins, a wooden scroll-rod down the left with turned end-knobs (jiku),
 * a vertical tategaki title, and a single vermilion accent — the carved hanko (印)
 * that seals your name.
 *
 *   • INK-WASH — soft grey sumi clouds breathe in the margins (decorative).
 *   • SCROLL-ROD — a wood-toned rod with turned end-knobs runs down the left
 *     gutter; a faint 履歴書 tategaki column hangs in the right margin (both hidden
 *     on narrow viewports / print).
 *   • CARVED SEAL — your masthead name is stamped with a carved cinnabar seal
 *     (inset keyline, hand-stamped tilt); a large faint 印 watermark sits behind it.
 *   • SUMI DIVIDERS — section headings carry a vermilion seal-tick, a gilt hairline
 *     and a brush-tapered ink underline that lifts at its end.
 *   • SIGNED SELF-NAME — your own (identifier-matched, never name-string-matched)
 *     name is sumi-bold under a fine vermilion brush rule.
 *
 * Palette is a FIXED washi/sumi/vermilion/gilt identity (NOT account-accent-
 * derived). Motion is RESTRAINED. Guardrails: sumi ink ~14:1 on the washi page;
 * vermilion text (#9e2b1e) ~5.5:1; the bright seal vermilion is a fill/decoration.
 * `prefers-reduced-motion` stills all motion; print drops the scroll furniture.
 * CSS-ONLY, light page. Not a mascot style; the seal is the character.
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
    --cv-ink:#1f1d1a; --cv-ink-2:#3a3631; --cv-muted:#5f594f; --cv-faint:#71695e;
    --cv-rule: rgba(31,29,26,0.16); --cv-rule-strong: rgba(31,29,26,0.30); --cv-page:#f7f4ec;
    --hk-paper:#f7f4ec;
    --hk-seal:#b7352b; --hk-seal-ink:#9e2b1e;
    --hk-gold:#b08d4f; --hk-wood1:#cdbfa3; --hk-wood2:#8a6a3a; --hk-wood3:#5e4626;
    --hk-rule: rgba(31,29,26,0.5);
    --hk-serif: ui-serif, "Hiragino Mincho ProN", "Yu Mincho", Georgia, "Times New Roman", serif;
    --hk-sans: ui-sans-serif, system-ui, "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--hk-serif);
    background-image: repeating-linear-gradient(0deg, rgba(120,108,86,0.035) 0 1px, transparent 1px 5px); }

  /* ---- Sumi-e ink-wash clouds in the margins ---- */
  .hk-wash { position:fixed; inset:0; z-index:0; pointer-events:none; animation: hk-wash 15s ease-in-out infinite;
    background:
      radial-gradient(42% 30% at 80% 14%, rgba(40,38,34,0.05), transparent 70%),
      radial-gradient(48% 34% at 10% 76%, rgba(40,38,34,0.045), transparent 72%),
      radial-gradient(30% 22% at 62% 58%, rgba(40,38,34,0.028), transparent 70%); }
  @keyframes hk-wash { 0%,100% { opacity:0.7; } 50% { opacity:1; } }

  /* ---- Scroll-rod with turned end-knobs (jiku) ---- */
  .hk-scroll { position:fixed; left: clamp(14px, 4.5vw, 58px); top:7vh; bottom:7vh; width:3px;
    z-index:0; pointer-events:none;
    background: linear-gradient(180deg, var(--hk-wood1), #b9a988 60%, var(--hk-wood2));
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05); }
  .hk-scroll::before, .hk-scroll::after { content:""; position:absolute; left:50%; transform:translateX(-50%);
    width:13px; height:13px; border-radius:50%;
    background: radial-gradient(circle at 35% 32%, var(--hk-wood2), var(--hk-wood3));
    box-shadow: 0 1px 2px rgba(0,0,0,0.22), inset 0 0 2px rgba(255,255,255,0.2); }
  .hk-scroll::before { top:-9px; } .hk-scroll::after { bottom:-9px; }

  /* ---- Vertical tategaki title in the right margin ---- */
  .hk-tate { position:fixed; top:9vh; right: clamp(16px, 4vw, 54px); z-index:0; pointer-events:none;
    writing-mode: vertical-rl; font-family: var(--hk-serif); font-size: clamp(1rem, 2.2vw, 1.5rem);
    letter-spacing:0.34em; color: rgba(31,29,26,0.17); }
  @media (max-width: 1100px) { .hk-scroll, .hk-tate { display:none; } }

  .cv { position:relative; z-index:1; max-width: 720px; margin:0 auto;
    padding: clamp(52px, 9vw, 104px) clamp(28px, 7vw, 76px) 140px; }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; isolation:isolate; margin-bottom: 3rem; padding-bottom: 2rem;
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header > * { position:relative; z-index:1; }
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; font-family: var(--hk-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.32em; text-transform:uppercase;
    color: var(--hk-seal-ink); margin-bottom:1.4rem;
  }
  /* Large faint 印 (seal) watermark behind the name. */
  header.cv-header::after {
    content:"印"; position:absolute; top:-0.22em; left:-0.04em; z-index:0; pointer-events:none;
    font-family: var(--hk-serif); line-height:1; font-size: clamp(6rem, 17vw, 11rem);
    color: var(--hk-seal); opacity:0.06;
  }
  .cv-headmain { gap: 2.2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--hk-serif); font-size: clamp(2.3rem, 6.4vw, 3.8rem); font-weight:500;
    line-height:1.12; letter-spacing:0.005em; color: var(--cv-ink); margin:0 0 0.55rem;
  }
  /* The carved hanko stamped after the name: solid cinnabar, inset keyline, tilt. */
  header.cv-header h1::after {
    content:"Σ"; display:inline-grid; place-items:center; vertical-align:0.16em;
    width:1.55em; height:1.55em; margin-left:0.42em; font-size:0.4em; font-weight:700;
    background: var(--hk-seal); color: var(--hk-paper); border-radius:0.16em; transform: rotate(-5deg);
    box-shadow: inset 0 0 0 1.5px rgba(247,244,236,0.28), 0 1px 2px rgba(0,0,0,0.18); }
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
  /* Washi-mounted portrait with a gilt keyline. */
  .cv-photo { width:118px; height:148px; border-radius:2px; object-fit:cover;
    border:5px solid #fffdf6; outline:1px solid var(--hk-gold); outline-offset:-6px;
    box-shadow: 0 14px 30px -18px rgba(31,29,26,0.5); filter: grayscale(0.4) contrast(1.02); }

  /* ---- Sections: seal-tick + gilt hairline + brush-tapered underline ---- */
  section.cv-section { margin-top: 3rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.5rem; padding-bottom:0.75rem;
    font-family: var(--hk-sans); font-size:0.78rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.22em; color: var(--cv-ink); margin:0 0 1.2rem;
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:0.08em; width:0.55rem; height:0.55rem;
    background: var(--hk-seal); border-radius:1px; transform: rotate(45deg);
    box-shadow: 0 0 0 3px rgba(183,53,43,0.08); }
  /* A gilt hairline sits just above the brush rule. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.5rem; right:0; bottom:0; height:3px; transform-origin:0 50%;
    background:
      linear-gradient(90deg, var(--hk-gold) 0, transparent 42%) 0 0/100% 1px no-repeat,
      linear-gradient(90deg, var(--cv-ink) 0, var(--cv-ink) 56%, transparent 100%) 0 100%/100% 1.5px no-repeat; }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:0.98rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--hk-seal);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }
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
    .hk-scroll, .hk-tate, .hk-wash { display:none !important; }
    header.cv-header::after { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const hankoTemplate: CvTemplate = {
  key: "hanko",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + hankoCss(theme);
    const body =
      `<div class="hk-wash" aria-hidden="true"></div>` +
      `<div class="hk-scroll" aria-hidden="true"></div>` +
      `<div class="hk-tate" aria-hidden="true">履歴書</div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
