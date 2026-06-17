/**
 * Public-page showcase styles — the animated, web-only renderings of the living
 * public CV page (`/p/[slug]`). These are NOT export templates: they only ever
 * render the public HTML page, never a PDF/DOCX/LaTeX/Markdown export (those
 * always use the document `template`). Selected by `display.publicStyle`.
 *
 * Each style is a `CvTemplate` (same contract as the document templates) and is
 * CSS-only: it derives its palette from the user's accent, supports the photo,
 * and ships a `prefers-reduced-motion` fallback + an `@supports` guard so a
 * browser without scroll-driven animations still shows the full static page.
 */
import type { CanonicalCv, PublicStyleKey } from "@/lib/canonical/schema";
import { buildRenderedSections, renderCvHtml } from "../html";
import { resolveTheme } from "../templates";
import type { CvTemplate } from "../templates/types";
import type { RenderOpts } from "../types";
import { arcadeTemplate } from "./arcade";
import { auraTemplate } from "./aura";
import { clockworkTemplate } from "./clockwork";
import { cyberpunkTemplate } from "./cyberpunk";
import { folioTemplate } from "./folio";
import { luminaTemplate } from "./lumina";
import { marqueeTemplate } from "./marquee";
import { meadowTemplate } from "./meadow";
import { meridianTemplate } from "./meridian";
import { meshTemplate } from "./mesh";
import { neonTemplate } from "./neon";
import { popTemplate } from "./pop";
import { prismTemplate } from "./prism";
import { risoTemplate } from "./riso";
import { synthwaveTemplate } from "./synthwave";
import { terminalTemplate } from "./terminal";
import { trajectoryTemplate } from "./trajectory";

type AnimatedStyleKey = Exclude<PublicStyleKey, "match">;

// The four "credible / shareable" styles are listed first so they surface at the
// top of the picker (the lever for getting more CVs published as living pages);
// the expressive styles follow. Order here defines PUBLIC_STYLE_KEYS.
const REGISTRY: Record<AnimatedStyleKey, CvTemplate> = {
  folio: folioTemplate,
  meridian: meridianTemplate,
  trajectory: trajectoryTemplate,
  lumina: luminaTemplate,
  prism: prismTemplate,
  pop: popTemplate,
  neon: neonTemplate,
  synthwave: synthwaveTemplate,
  terminal: terminalTemplate,
  riso: risoTemplate,
  aura: auraTemplate,
  mesh: meshTemplate,
  marquee: marqueeTemplate,
  clockwork: clockworkTemplate,
  arcade: arcadeTemplate,
  meadow: meadowTemplate,
  cyberpunk: cyberpunkTemplate,
};

/** The animated style keys (everything except "match"), in catalog order. */
export const PUBLIC_STYLE_KEYS = Object.keys(REGISTRY) as AnimatedStyleKey[];

export function getPublicStyle(key: AnimatedStyleKey): CvTemplate {
  return REGISTRY[key];
}

/**
 * Render the living public page. When `display.publicStyle` selects an animated
 * style, render with it; otherwise ("match", the default) render with the
 * document template via `renderCvHtml`. The public route is the ONLY caller —
 * exports go straight through `renderCvHtml`, so a showcase style can never
 * leak into a PDF/DOCX/LaTeX.
 */
export function renderPublicCvHtml(cv: CanonicalCv, opts?: RenderOpts): string {
  const style = cv.display.publicStyle;
  if (style === "match") return renderCvHtml(cv, opts);
  return REGISTRY[style].render(cv, buildRenderedSections(cv), resolveTheme(cv.display), opts);
}
