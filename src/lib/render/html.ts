import type {
  CanonicalCv,
  CvItem,
  DisplayChoices,
} from "@/lib/canonical/schema";
import { highlightSelf } from "@/lib/citeproc/highlight";
import { escapeHtml } from "./escape";
import { prepareSections } from "./prepare";
import { cvSlug } from "./slug";
import { getTemplate, resolveTheme } from "./templates";
import type { RenderedSection } from "./templates/types";
import type { Renderer, RenderInput, RenderResult } from "./types";

export { cvSlug } from "./slug";

/** Inline badges appended to a publication/preprint entry (HTML/PDF only). */
function itemBadges(item: CvItem, display: DisplayChoices): string {
  const badges: string[] = [];
  if (display.showOpenAccess && item.meta.oaStatus) {
    badges.push(
      `<span class="cv-badge cv-badge-oa" title="Open access (${escapeHtml(
        item.meta.oaStatus,
      )})">OA</span>`,
    );
  }
  if (display.showAuthorRole && item.meta.authorRole) {
    badges.push(
      `<span class="cv-badge cv-badge-role">${escapeHtml(item.meta.authorRole)}</span>`,
    );
  }
  return badges.length ? ` ${badges.join("")}` : "";
}

/**
 * Render the canonical object to a standalone HTML document.
 *
 * Single rendering path shared by the preview and (via the PDF renderer) the
 * PDF export. Citations are produced once by citeproc for consistency; each
 * entry is then highlighted iff the item is the user's own (identifier match)
 * and highlighting is enabled.
 */
export function renderCvHtml(cv: CanonicalCv): string {
  const rendered: RenderedSection[] = prepareSections(cv, "html").map(
    ({ section, items }) => ({
      section,
      items: items.map(({ item, entry }) => {
        let html = entry;
        if (
          cv.display.highlightSelf &&
          item.authoredBySelf &&
          item.selfNameVariants.length > 0
        ) {
          html = highlightSelf(html, item.selfNameVariants);
        }
        html += itemBadges(item, cv.display);
        return { item, html };
      }),
    }),
  );

  const template = getTemplate(cv.display.template);
  const theme = resolveTheme(cv.display);
  return template.render(cv, rendered, theme);
}

export const htmlRenderer: Renderer = {
  format: "html",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    const html = renderCvHtml(cv);
    return {
      format: "html",
      mimeType: "text/html; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.html`,
      html,
      text: html,
    };
  },
};
