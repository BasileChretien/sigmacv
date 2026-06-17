/**
 * Public-page showcase style — "Marquee".
 * Kinetic editorial: a bold scrolling MARQUEE ribbon of the name under the
 * header, oversized headings with a dot bullet, arrow publication markers,
 * slide-in reveals. Mono-accent (rides --cv-accent directly). CSS-ONLY.
 */
import {
  attributionFooter,
  commonCss,
  cvPageShell,
  escapeHtml,
  headerHtml,
  licenseFooter,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";

function marqueeCss(_t: TemplateTheme): string {
  return `
  body { min-height:100vh; background:#fbfbfd; color:var(--cv-ink); overflow-x:hidden; }
  .cv { max-width:880px; padding:48px 56px 120px; }

  header.cv-header { margin-bottom:0; }
  header.cv-header h1 { font-size:clamp(2.4rem,7.5vw,4.4rem); font-weight:800; letter-spacing:-0.035em; line-height:0.96; color:var(--cv-ink); }
  header.cv-header .cv-headline { color:var(--cv-accent); font-weight:700; margin-top:0.35rem; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color:var(--cv-accent); }
  .cv-photo { width:122px; height:122px; border-radius:16px; border:4px solid var(--cv-accent); box-shadow:6px 6px 0 var(--cv-accent-soft); }

  /* The scrolling ribbon */
  .marquee { overflow:hidden; white-space:nowrap; margin:1.8rem 0 2.2rem;
    border-top:3px solid var(--cv-accent); border-bottom:3px solid var(--cv-accent); padding:0.34em 0; background:var(--cv-accent-soft); }
  .mq-inner { display:inline-flex; align-items:center; animation: mq 28s linear infinite; }
  .mq-inner span { font-size:clamp(1.1rem,3vw,1.6rem); font-weight:800; text-transform:uppercase; letter-spacing:0.04em; padding:0 0.7rem; color:var(--cv-accent); }
  .mq-inner .mq-star { color:var(--cv-ink-2); }
  @keyframes mq { to { transform: translateX(-50%); } }

  section.cv-section { margin-top:2.2rem; }
  section.cv-section > h2 { display:flex; align-items:center; gap:0.55rem; font-size:clamp(1.05rem,2.6vw,1.55rem); font-weight:800;
    text-transform:uppercase; letter-spacing:-0.01em; color:var(--cv-ink); margin:0 0 0.7rem; padding-bottom:0.3rem; border-bottom:3px solid var(--cv-accent); }
  section.cv-section > h2::before { content:""; width:0.7em; height:0.7em; border-radius:50%; background:var(--cv-accent); flex:none; }
  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:"\\2192"; position:absolute; left:0; color:var(--cv-accent); font-weight:800; }

  @keyframes mq-in { from{opacity:0;transform:translateX(-34px)} to{opacity:1;transform:none} }
  @keyframes mq-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal heading + entries on their own (small) geometry, never the whole
       section — a tall section animated as one block stays faded/slid at its top
       while its first entries are already in the reading zone. */
    section.cv-section > h2, .cv-prose-body > * { animation: mq-in cubic-bezier(0.22,1,0.36,1) both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: mq-in ease-out both; animation-timeline: view(); animation-range: entry 0% entry 50%; }
  }
  @supports (animation-timeline: scroll()) {
    .mq-progress { position:fixed; top:0; left:0; height:4px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: var(--cv-accent); animation: mq-progress linear both; animation-timeline: scroll(root); }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    .mq-inner { transform:none !important; }
    .mq-progress { display:none; }
  }`;
}

export const marqueeTemplate: CvTemplate = {
  key: "marquee",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + marqueeCss(theme);
    const tag = escapeHtml(
      `${cv.owner.displayName || "Curriculum Vitæ"} — ${cv.owner.headline || "Curriculum Vitæ"}`,
    );
    const seq = Array(6).fill(`<span>${tag}</span><span class="mq-star">&#10022;</span>`).join("");
    const ribbon = `<div class="marquee" aria-hidden="true"><div class="mq-inner">${seq}${seq}</div></div>`;
    const header = headerHtml(cv, { photo: true });
    // Slot the ribbon between the header and the sections.
    const body =
      `<div class="mq-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      header +
      ribbon +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
