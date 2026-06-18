/**
 * Public-page showcase style — "Trajectory".
 * A structural CAREER-TIMELINE. A single accent rail runs down the left of the
 * page; every section heading sits on the rail as a milestone NODE; the entries
 * hang to the right of the line. Light page for credibility, with the user's
 * accent colouring the rail, the nodes and the self-name. As you scroll, the
 * rail "draws" itself (a clipped fill overlay), nodes light up and entries
 * settle in — but the structure reads PERFECTLY without any scroll support:
 * the static rail, the static nodes and every entry are fully visible by
 * default. The LAYOUT itself is the wow. CSS-ONLY.
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

function trajectoryCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Soft tinted-light credibility palette. Ink end of the ramp for body text
       so entry copy near the rail clears WCAG AA on the near-white surface. */
    --cv-ink:#1b2230; --cv-ink-2:#39414f; --cv-muted:#525b6a; --cv-faint:#5b6573;
    --cv-rule: rgba(27,34,48,0.12); --cv-rule-strong: rgba(27,34,48,0.26); --cv-page:#fbfcfe;
    /* Rail geometry: width of the gutter the rail lives in + line thickness. */
    --rail-x: 30px;        /* centre of the rail, measured from the wrapper edge */
    --rail-w: 2px;         /* the static line thickness */
    --node: 15px;          /* milestone dot diameter */
    /* A readable tint of the accent for soft fills (rail track, node ring). */
    --accent-tint: color-mix(in oklch, var(--cv-accent) 16%, transparent);
    --accent-faint: color-mix(in oklch, var(--cv-accent) 9%, transparent);
  }
  body { min-height:100vh; color:var(--cv-ink); background:
    radial-gradient(120% 80% at 100% 0%, var(--accent-faint), transparent 60%),
    var(--cv-page); background-attachment: fixed; }

  /* The wrapper carries the rail. Left padding opens the gutter the rail and the
     milestone nodes occupy; everything (header + sections) hangs to its right. */
  .cv { max-width: 820px; padding: 60px 44px 120px calc(var(--rail-x) + 34px); position: relative; }

  /* --- The STATIC rail: a 2px accent-tinted line down the whole wrapper. Always
     visible, with zero @supports — this is the spine that must read on any
     browser. It sits in the gutter at --rail-x. --- */
  .cv::before {
    content:""; position:absolute; top:0; bottom:0;
    left: var(--rail-x); width: var(--rail-w); transform: translateX(-50%);
    background: var(--accent-tint);
    border-radius: 2px;
  }

  /* --- The scroll "draw" overlay: a brighter accent line clipped to scroll
     progress, laid ON the static track. Purely decorative; gated behind
     @supports (animation-timeline: scroll(root)) so non-supporting browsers
     simply never see it and keep the static rail. --- */
  .traj-rail-progress { display: none; }

  /* ---- Header (the "start" of the journey) — hangs right of the rail with its
     own origin node. ---- */
  header.cv-header { position: relative; margin-bottom: 2.2rem; padding-bottom: 1.4rem;
    border-bottom: 1px solid var(--cv-rule); }
  /* Origin marker: a filled accent disc on the rail, level with the name — the
     "start" of the trajectory. Ringed in the page colour so the rail reads as
     passing through it. */
  header.cv-header::after {
    content:""; position:absolute; top:0.55em;
    left: calc(-1 * 34px - var(--node) / 2); /* back over the gutter onto the rail */
    width: var(--node); height: var(--node); border-radius: 50%;
    background: var(--cv-accent);
    box-shadow: 0 0 0 5px var(--cv-page), 0 0 0 7px var(--accent-tint);
  }
  header.cv-header h1 { font-size: clamp(2rem, 5.5vw, 3.1rem); font-weight: 700;
    letter-spacing: -0.02em; line-height: 1.04; color: var(--cv-ink); text-wrap: balance; }
  header.cv-header .cv-headline { color: var(--cv-ink-2); font-weight: 500; margin-top: 0.35rem; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--cv-accent); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width: 68ch; }
  .cv-photo { width: 108px; height: 108px; border-radius: 14px; object-fit: cover;
    border: 1px solid var(--cv-rule-strong); box-shadow: 0 10px 30px -16px rgba(27,34,48,0.45); }
  .cv-self { color: var(--cv-accent) !important; font-weight: 700; }

  /* ---- Each section heading is a MILESTONE node on the rail. Generic across
     every heading (Publications / Education / Grants / …) and any order — no
     nth-child, no hardcoded years. ---- */
  section.cv-section { position: relative; margin-top: 2.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position: relative; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.01em;
    color: var(--cv-ink); margin: 0 0 0.9rem; text-transform: none;
  }
  /* The node: a filled accent dot sitting ON the rail, ringed so the line reads
     as passing "through" the milestone. The negative left pulls it from the
     heading's text origin back over the gutter onto the rail centre. */
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position: absolute; top: 0.34em;
    left: calc(-1 * 34px - var(--node) / 2);
    width: var(--node); height: var(--node); border-radius: 50%;
    background: var(--cv-page);
    border: 3px solid var(--cv-accent);
    box-shadow: 0 0 0 5px var(--cv-page);
  }
  /* A short connector tick from the rail to the heading text, so the eye links
     the node to its label. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position: absolute; top: 0.62em;
    left: calc(-1 * 34px + var(--node) / 2);
    width: calc(34px - var(--node) / 2 - 4px); height: 2px;
    background: var(--accent-tint);
  }

  ol.cv-bib > li { position: relative; }
  ol.cv-bib > li a { color: var(--cv-accent); }
  .csl-entry { color: var(--cv-ink-2); }

  /* ---- Motion ---- */
  @keyframes traj-node-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: none; } }
  @keyframes traj-head-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes traj-entry-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes traj-draw { from { transform: scaleY(0); } to { transform: scaleY(1); } }

  /* Per-heading + per-entry reveals ONLY (never the whole tall section). Each
     reveal ENHANCES an already-visible default: the @media reduced-motion block
     and the no-@supports default both leave everything fully opaque. */
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h { animation: traj-head-in cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before { animation: traj-node-in cubic-bezier(0.34,1.2,0.4,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    ol.cv-bib > li { animation: traj-entry-in ease-out both;
      animation-timeline: view(); animation-range: entry 0% cover 10%; }
  }

  /* The scroll-driven rail "draw": a fixed accent line clipped to scaleY of page
     scroll, riding ON the static rail. Vertical analogue of the terminal
     progress bar. Gated so it never appears without scroll-timeline support. */
  @supports (animation-timeline: scroll(root)) {
    .traj-rail-progress {
      display: block; position: fixed; top: 0; bottom: 0;
      left: calc(var(--rail-x) + 24px); width: 3px; z-index: 1; pointer-events: none;
      transform-origin: 50% 0; transform: scaleY(0);
      background: linear-gradient(to bottom, var(--cv-accent), color-mix(in oklch, var(--cv-accent) 55%, transparent));
      border-radius: 3px; box-shadow: 0 0 12px var(--accent-tint);
      animation: traj-draw linear both; animation-timeline: scroll(root);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    /* Revealed elements stay put and visible. */
    section.cv-section > h2, .cv-summary-block > .cv-summary-h, ol.cv-bib > li { opacity: 1 !important; transform: none !important; filter: none !important; }
    /* Nodes must remain fully visible (they are ::before of the heading). */
    section.cv-section > h2::before, header.cv-header::after { opacity: 1 !important; transform: none !important; }
    /* Hide the scroll-fill overlay — the static rail (.cv::before) carries the line. */
    .traj-rail-progress { display: none !important; }
  }

  /* On a phone the gutter narrows so the rail never crowds the copy. */
  @media (max-width: 560px) {
    :root { --rail-x: 20px; --node: 13px; }
    .cv { padding: 44px 22px 96px calc(var(--rail-x) + 24px); }
    section.cv-section > h2::before, header.cv-header::after { left: calc(-1 * 24px - var(--node) / 2); }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { left: calc(-1 * 24px + var(--node) / 2); width: calc(24px - var(--node) / 2 - 4px); }
  }

  /* Print: drop the decorative rail/nodes for a clean document. */
  @media print {
    .cv { padding: 0; max-width: none; }
    .cv::before, .traj-rail-progress,
    section.cv-section > h2::before, section.cv-section > h2::after, header.cv-header::after { display: none !important; }
  }`;
}

export const trajectoryTemplate: CvTemplate = {
  key: "trajectory",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + trajectoryCss(theme);
    const body =
      `<div class="traj-rail-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
