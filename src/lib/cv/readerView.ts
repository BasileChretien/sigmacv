import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "@/lib/render/escape";
import { applyReaderMode } from "@/lib/render/readerMode";
import { viewFilterQuery, type ViewFilters } from "./viewFilter";

/**
 * The assessor's "Reader view" of the public living page (`/p/[slug]?view=reader`).
 *
 * Route-side helpers around the pure preset in `render/readerMode.ts`: parse the
 * query param, gate it on the OWNER's opt-in (`display.allowReaderMode` — without
 * it the param is simply ignored and the standard page is served), derive the
 * reader-view CV, and build the two pieces of page chrome — the quiet "Reader view"
 * link on the standard page, and the banner at the top of the reader view — plus
 * the `<head>` tags that keep the view out of search indexes (it is the same
 * content re-presented; the canonical URL stays the plain page). Pure + immutable.
 */

/** Query param / value that request the reader view. */
const READER_VIEW_PARAM = "view";
const READER_VIEW_VALUE = "reader";

/** True when the request carries `?view=reader` (a request, not yet a permission). */
export function isReaderViewRequested(params: URLSearchParams): boolean {
  return params.get(READER_VIEW_PARAM) === READER_VIEW_VALUE;
}

/**
 * Whether to SERVE the reader view: the visitor asked for it AND the owner allowed
 * it. Fails closed — an unpublished opt-in, or the param on a CV without it, yields
 * the standard page.
 */
export function readerViewActive(params: URLSearchParams, cv: CanonicalCv): boolean {
  return isReaderViewRequested(params) && cv.display.allowReaderMode === true;
}

/** The extra query param the filter-bar chips carry so facets keep the reader view. */
export const READER_VIEW_KEEP: Readonly<Record<string, string>> = {
  [READER_VIEW_PARAM]: READER_VIEW_VALUE,
};

/** The reader-view CV: the same (already public-projected) document with the
 *  reader-mode display preset applied. Never persisted; render input only. */
export function readerViewCv(cv: CanonicalCv): CanonicalCv {
  return { ...cv, display: applyReaderMode(cv.display) };
}

/**
 * The quiet "Reader view" link shown on the STANDARD page when the owner opted in.
 * Preserves the active filters so the visitor lands on the same narrowed view.
 * Injected by the route above the sections (the `<main class="cv-main">` anchor the
 * filter bar also uses); styled by `commonCss` (`.cv-readerbar`).
 */
export function readerViewLinkHtml(filters: ViewFilters, locale: string): string {
  const s = renderStrings(locale);
  const href = escapeHtml(viewFilterQuery(filters, READER_VIEW_KEEP));
  return (
    `<nav class="cv-readerbar" aria-label="${escapeHtml(s.readerLinkLabel)}">` +
    `<a href="${href}" title="${escapeHtml(s.readerLinkTitle)}">${escapeHtml(
      s.readerLinkLabel,
    )}</a></nav>`
  );
}

/**
 * The banner at the top of the READER view: says what the view shows (and that
 * nothing in it is a score) with a link back to the standard page, keeping the
 * active filters. Styled by `commonCss` (`.cv-readerbanner`).
 */
export function readerViewBannerHtml(filters: ViewFilters, locale: string): string {
  const s = renderStrings(locale);
  const back = escapeHtml(viewFilterQuery(filters));
  return (
    `<aside class="cv-readerbanner" role="note">${escapeHtml(s.readerBannerText)}` +
    `<a href="${back}">${escapeHtml(s.readerBannerBack)}</a></aside>`
  );
}

/**
 * `<head>` additions for the reader view: a `noindex` robots meta so the re-presented
 * page never competes with the standard page in search (the route also sends the
 * matching `X-Robots-Tag`). The `<link rel="canonical">` to the PLAIN page comes from
 * `publicMetaTags` — the route passes the un-parameterised page URL for both views.
 */
export function readerViewHeadTags(): string {
  return '<meta name="robots" content="noindex, nofollow" />';
}
