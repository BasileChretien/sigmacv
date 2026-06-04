import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale } from "@/lib/i18n";
import { escapeHtml } from "./escape";
import { buildRenderedSections } from "./html";
import { cvSlug } from "./slug";
import { resolveTheme } from "./templates";
import {
  commonCss,
  cvDocTitle,
  headerHtml,
  provenanceFooter,
  sectionsHtml,
} from "./templates/shared";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * A vibrant web theme for the standalone page: an animated gradient hero, white
 * data cards floating on it, accent chip section labels, and hover affordances.
 * Distinct from the print templates — this one is meant to live in a browser.
 */
function webThemeCss(accent: string): string {
  const gutter = "clamp(20px, 5vw, 60px)";
  return `
  body { background: #f6f7fb; }
  .cv { max-width: 880px; padding: 0; margin: 0 auto; box-shadow: 0 24px 60px rgba(15,23,42,0.12); background: #fff; }

  /* Animated gradient hero. */
  header.cv-header {
    background: linear-gradient(120deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #0b1020) 55%, ${accent} 100%);
    background-size: 220% 220%;
    animation: heroShift 14s ease-in-out infinite;
    color: #fff; padding: clamp(40px, 7vw, 72px) ${gutter} clamp(36px, 6vw, 56px); margin: 0;
  }
  @keyframes heroShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

  header.cv-header h1 { font-size: clamp(2.1rem, 5.5vw, 3.2rem); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 0.98; }
  header.cv-header .cv-honorific { color: #fff; }
  .cv-headline { color: rgba(255,255,255,0.95); font-size: clamp(1.05rem, 2.6vw, 1.34rem); font-weight: 500; margin-top: 0.5rem; }
  .cv-ids, .cv-contact, .cv-links, .cv-metrics { color: rgba(255,255,255,0.9); }
  .cv-ids a, .cv-contact a, .cv-links a { color: #fff; }
  .cv-metric-context { color: rgba(255,255,255,0.72); }
  .cv-summary { color: rgba(255,255,255,0.95); }
  .cv-photo { width: 122px; height: 122px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.4); box-shadow: 0 8px 22px rgba(0,0,0,0.22); }
  .cv-charts, .cv-authorship { border: 0; border-radius: 14px; box-shadow: 0 10px 26px rgba(0,0,0,0.20); }

  section.cv-section { margin: 0 ${gutter}; padding: clamp(1rem, 3vw, 1.6rem) 0; }
  section.cv-section + section.cv-section { border-top: 1px solid var(--cv-rule); }
  section.cv-section > h2 {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;
    color: ${accent}; margin: 0 0 0.8rem;
  }
  section.cv-section > h2::before { content: ""; width: 22px; height: 4px; border-radius: 4px; background: ${accent}; }

  /* Interactive: bibliography rows lift + reveal an accent edge on hover. */
  ol.cv-bib > li { padding-left: calc(var(--cv-hang) + 0.6rem); border-left: 3px solid transparent; transition: border-color 0.18s ease, transform 0.18s ease; }
  ol.cv-bib > li:hover { border-left-color: ${accent}; transform: translateX(3px); }
  ol.cv-bib > li a { color: ${accent}; }
  .cv-provenance { margin: 1.4rem ${gutter} 0; padding-bottom: clamp(28px, 5vw, 48px); }
  `;
}

/**
 * Pure-CSS entrance animation. Each block animates from hidden to its natural
 * state with `animation-fill-mode: both`, so it ALWAYS ends visible — no JS, so
 * it can never get stuck hidden (the earlier scroll-reveal could). Staggered so
 * the page assembles itself on load. Disabled under prefers-reduced-motion.
 */
const ANIMATION_CSS = `
  @keyframes cvRise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
  header.cv-header { animation: cvRise 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  section.cv-section { animation: cvRise 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  section.cv-section:nth-of-type(1) { animation-delay: 0.10s; }
  section.cv-section:nth-of-type(2) { animation-delay: 0.18s; }
  section.cv-section:nth-of-type(3) { animation-delay: 0.26s; }
  section.cv-section:nth-of-type(4) { animation-delay: 0.34s; }
  section.cv-section:nth-of-type(n+5) { animation-delay: 0.42s; }
  .cv-provenance { animation: cvRise 0.6s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.5s; }
  @media (prefers-reduced-motion: reduce) {
    header.cv-header, section.cv-section, .cv-provenance { animation: none; }
  }`;

/** Render the canonical CV as a standalone, animated, interactive web page. */
export function renderCvWebpage(cv: CanonicalCv): string {
  const rendered = buildRenderedSections(cv);
  const theme = resolveTheme(cv.display);
  const accent = theme.accentColor;
  const css = commonCss(theme) + webThemeCss(accent) + ANIMATION_CSS;
  const lang = asLocale(cv.display.locale);
  const title = escapeHtml(cvDocTitle(cv));
  const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(rendered)}${provenanceFooter(cv)}</div>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

export const webpageRenderer: Renderer = {
  format: "webpage",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    const html = renderCvWebpage(cv);
    return {
      format: "webpage",
      mimeType: "text/html; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv-web.html`,
      html,
      text: html,
    };
  },
};
