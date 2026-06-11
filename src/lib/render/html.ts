import {
  displayInstitution,
  type CanonicalCv,
  type CvItem,
  type DisplayChoices,
} from "@/lib/canonical/schema";
import { highlightSelf } from "@/lib/citeproc/highlight";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml, safeHref } from "./escape";
import { prepareSections } from "./prepare";
import { cvSlug } from "./slug";
import { getTemplate, resolveTheme } from "./templates";
import type { RenderedSection } from "./templates/types";
import type { RenderOpts, Renderer, RenderInput, RenderResult } from "./types";

export { cvSlug } from "./slug";

/** Inline badges appended to a publication/preprint entry (HTML/PDF only). */
function itemBadges(item: CvItem, display: DisplayChoices): string {
  const badges: string[] = [];
  // Retraction is a research-integrity flag — always shown (never opt-out), and
  // first so it can't be missed.
  if (item.meta.retracted) {
    const s = renderStrings(display.locale);
    badges.push(
      `<span class="cv-badge cv-badge-retracted" title="${escapeHtml(
        s.badgeRetractedTitle,
      )}">${escapeHtml(s.badgeRetracted)}</span>`,
    );
  }
  if (display.showOpenAccess && item.meta.oaStatus) {
    const s = renderStrings(display.locale);
    const title = s.badgeOpenAccessTitle.replace("{status}", escapeHtml(item.meta.oaStatus));
    badges.push(
      `<span class="cv-badge cv-badge-oa" title="${title}">${escapeHtml(s.badgeOpenAccess)}</span>`,
    );
  }
  if (display.showAuthorRole && item.meta.authorRole) {
    badges.push(`<span class="cv-badge cv-badge-role">${escapeHtml(item.meta.authorRole)}</span>`);
  }
  if (display.showCitationCounts && typeof item.meta.citedByCount === "number") {
    const s = renderStrings(display.locale);
    const n = new Intl.NumberFormat(display.locale).format(item.meta.citedByCount);
    badges.push(
      `<span class="cv-badge cv-badge-cites" title="${escapeHtml(
        s.badgeCitationsTitle,
      )}">${escapeHtml(s.badgeCitations.replace("{n}", n))}</span>`,
    );
  }
  // Wrap the group in an inline-flex container (own `gap` + `margin-left`) so the
  // badges can never collapse against the preceding citation text/URL or against
  // each other — a plain joining space did, depending on the CSL style's trailing
  // node (e.g. a bare URL in APA) and on whitespace collapsing.
  return badges.length ? `<span class="cv-badges">${badges.join("")}</span>` : "";
}

/** The canonical ROR IRI shape: `https://ror.org/<id>` (lowercase alnum body). */
const ROR_IRI = /^https:\/\/ror\.org\/[0-9a-z]+$/;

/** Canonical ROR href for a stored id (full URL or bare body), or null. */
function rorHref(rorId: string | undefined): string | null {
  if (!rorId) return null;
  const candidate = ROR_IRI.test(rorId) ? rorId : `https://ror.org/${rorId.trim()}`;
  return ROR_IRI.test(candidate) ? safeHref(candidate) : null;
}

/**
 * The href the institution NAME should point at: its own homepage when ROR
 * recorded one (`meta.institutionUrl`, re-validated through `safeHref`), else the
 * ROR record (a persistent identifier that never rots). `isSite` tells the caller
 * which it got, so the tooltip can describe the target. Returns null when the
 * item carries neither a usable website nor a ROR id.
 */
function institutionHref(item: CvItem): { href: string; isSite: boolean } | null {
  const site = safeHref(item.meta.institutionUrl);
  if (site) return { href: site, isSite: true };
  const ror = rorHref(item.meta.rorId);
  if (ror) return { href: ror, isSite: false };
  return null;
}

/**
 * Link a Positions/Education entry's institution. The institution NAME inside the
 * already-escaped line is wrapped in a quiet `<a>` pointing at the institution's
 * homepage (per ROR) or, failing that, the ROR record. If the name can't be
 * located (e.g. the user edited the title and dropped it), a small trailing "ROR"
 * link is appended so the persistent identifier stays reachable. Links only — no
 * image / external resource — so it needs no CSP relaxation; `externalizeLinks`
 * adds `target`/`rel` uniformly. Returns the html unchanged when the item carries
 * no institution link at all.
 */
function withRorLink(html: string, item: CvItem, locale: string): string {
  const link = institutionHref(item);
  if (!link) return html;
  const strings = renderStrings(locale);
  // Match against the localized name actually rendered into the line (prepare.ts
  // swaps in the CV-language variant), so the link still wraps the institution.
  const org = displayInstitution(item, locale)?.trim();
  if (org) {
    const esc = escapeHtml(org);
    const at = html.lastIndexOf(esc);
    if (at >= 0) {
      const title = escapeHtml(link.isSite ? strings.institutionSiteTitle : strings.rorRecordTitle);
      const open = `<a class="cv-ror-link" href="${link.href}" title="${title}">`;
      return `${html.slice(0, at)}${open}${esc}</a>${html.slice(at + esc.length)}`;
    }
  }
  // No locatable institution name → surface the ROR persistent identifier as a
  // small trailing link (the website is meant to sit behind the name, not a token).
  const ror = rorHref(item.meta.rorId);
  /* v8 ignore next -- a stored institutionUrl always comes with a valid rorId */
  if (!ror) return html;
  const title = escapeHtml(strings.rorRecordTitle);
  return `${html} <a class="cv-ror-link" href="${ror}" title="${title}">ROR</a>`;
}

/**
 * Render the canonical object to a standalone HTML document.
 *
 * Single rendering path shared by the preview and (via the PDF renderer) the
 * PDF export. Citations are produced once by citeproc for consistency; each
 * entry is then highlighted iff the item is the user's own (identifier match)
 * and highlighting is enabled.
 */
/**
 * Citeproc-render every section's bibliography (once), then highlight the
 * account holder's own entries and append inline badges. Shared by the print
 * templates (renderCvHtml) and the animated web export.
 */
export function buildRenderedSections(cv: CanonicalCv): RenderedSection[] {
  return prepareSections(cv, "html").map(({ section, items }) => {
    // Link the institution name to its ROR record on every Positions/Education
    // line, across all HTML templates. (The rirekisho template builds its own
    // 学歴・職歴 table from plain text, so it naturally opts out.)
    const linkRor = section.type === "positions" || section.type === "education";
    return {
      section,
      items: items.map(({ item, entry }) => {
        let html = entry;
        if (cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0) {
          html = highlightSelf(html, item.selfNameVariants);
        }
        html += itemBadges(item, cv.display);
        if (linkRor) html = withRorLink(html, item, cv.display.locale);
        return { item, html };
      }),
    };
  });
}

export function renderCvHtml(cv: CanonicalCv, opts?: RenderOpts): string {
  const rendered = buildRenderedSections(cv);
  const template = getTemplate(cv.display.template);
  const theme = resolveTheme(cv.display);
  return template.render(cv, rendered, theme, opts);
}

export const htmlRenderer: Renderer = {
  format: "html",
  async render({ cv, opts }: RenderInput): Promise<RenderResult> {
    const html = renderCvHtml(cv, opts);
    return {
      format: "html",
      mimeType: "text/html; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.html`,
      html,
      text: html,
    };
  },
};
