import { TEMPLATES, type CanonicalCv } from "@/lib/canonical/schema";
import { renderCvHtml } from "./html";

/** One template's thumbnail: its key + the rendered (real) HTML of the sample. */
export interface TemplatePreview {
  template: string;
  html: string;
}

/**
 * A trimmed copy of the CV for thumbnail rendering. The gallery only shows the
 * top of each page (scaled, clipped), so we cap items per section and the number
 * of sections to keep 11 renders cheap, and drop the provenance footer / top-N
 * cap so the sample looks like a fresh CV. Header + display choices (accent,
 * font, highlight) are kept so the thumbnail matches what the user will get.
 */
export function sampleForPreview(cv: CanonicalCv): CanonicalCv {
  const sections = cv.sections
    .slice(0, 4)
    .map((s) => ({ ...s, items: s.items.slice(0, 2) }));
  return {
    ...cv,
    sections,
    display: { ...cv.display, showProvenance: false, publicationsLimit: 0 },
  };
}

/**
 * Render the (trimmed) CV in EVERY template, so the editor gallery can show a
 * real, faithful thumbnail of each option — not an abstract schematic. Templates
 * differ only in chrome/CSS, so the same sample renders consistently in each.
 */
export function templateGalleryPreviews(cv: CanonicalCv): TemplatePreview[] {
  const base = sampleForPreview(cv);
  return TEMPLATES.map((template) => ({
    template,
    html: renderCvHtml({ ...base, display: { ...base.display, template } }),
  }));
}
