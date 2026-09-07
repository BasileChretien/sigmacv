import type { CanonicalCv, CvItem, DisplayChoices } from "@/lib/canonical/schema";
import { renderStrings, type RenderStrings } from "@/lib/i18n/render";
import { selectSections } from "@/lib/render/citationItems";
import { escapeHtml } from "@/lib/render/escape";
import { itemProvenanceMark, type ItemProvenanceMark } from "@/lib/render/itemProvenance";
import { applyReaderMode } from "@/lib/render/readerMode";
import { workIndicators } from "@/lib/render/workIndicators";
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
 * The recipient notice under the reader banner's lead line: four short, plain
 * sentences addressed to whoever is reading the page for assessment — the owner
 * published it for self-presentation; any assessment use rests on the reader's
 * own lawful basis; co-author / supervisee names are third-party data, not a
 * licence to profile; "Retracted" is a Crossref / Retraction Watch fact, not a
 * misconduct finding; an absent section or an absent source is not evidence of
 * absence. A plain `<p>` (never a `<details>`) so it prints with the page.
 */
function recipientNoticeHtml(s: RenderStrings): string {
  const sentences = [
    s.readerNoticePurpose,
    s.readerNoticeThirdParty,
    s.readerNoticeRetracted,
    s.readerNoticeAbsence,
  ];
  return `<p class="cv-readernotice">${sentences.map(escapeHtml).join(" ")}</p>`;
}

/**
 * The marks and badges the reader view ACTUALLY renders for this CV, collected
 * over the entries the page lists (`selectSections` — the same selection every
 * renderer draws from, so the legend and the page can never disagree).
 */
interface LegendFacts {
  /** Whether any listed entry carries the per-entry provenance mark (every
   *  section except the structured Positions / Education records). */
  marked: boolean;
  /** Distinct mark labels that name the SOURCE a record came from, in order of
   *  first appearance (on the public page: the only kind there is). */
  sources: string[];
  /** Distinct marks that are NOT a plain source name — owner-entered ("Manual"),
   *  owner-claimed by DOI, or an identifier match — each needing its own line. */
  special: ItemProvenanceMark[];
  verified: boolean;
  retracted: boolean;
  /** Distinct open-access statuses behind the OA badges shown, in order. */
  oaStatuses: string[];
  /** Distinct per-work indicator pills shown (`workIndicators`), in order. */
  indicators: { label: string; title: string }[];
}

/** Positions / Education render as structured history records: no provenance
 *  mark, no badge row (their Verified mark sits on the lead line). */
function isHistorySection(type: string): boolean {
  return type === "positions" || type === "education";
}

/** Append `value` unless an equal one (by `same`) is already in `list`. */
function pushOnce<T>(list: T[], value: T, same: (a: T, b: T) => boolean): void {
  if (!list.some((v) => same(v, value))) list.push(value);
}

function noteItem(
  facts: LegendFacts,
  item: CvItem,
  history: boolean,
  display: DisplayChoices,
): void {
  if (display.showVerifiedBadges && item.meta.verified) facts.verified = true;
  if (history) return;
  facts.marked = true;
  const mark = itemProvenanceMark(item, display.locale);
  if (mark.basis === "source") pushOnce(facts.sources, mark.label, (a, b) => a === b);
  else pushOnce(facts.special, mark, (a, b) => a.label === b.label);
  if (item.meta.retracted) facts.retracted = true;
  if (display.showOpenAccess && item.meta.oaStatus) {
    pushOnce(facts.oaStatuses, item.meta.oaStatus, (a, b) => a === b);
  }
  for (const ind of workIndicators(item, display)) {
    pushOnce(
      facts.indicators,
      { label: ind.label, title: ind.title },
      (a, b) => a.label === b.label,
    );
  }
}

function legendFacts(cv: CanonicalCv): LegendFacts {
  const facts: LegendFacts = {
    marked: false,
    sources: [],
    special: [],
    verified: false,
    retracted: false,
    oaStatuses: [],
    indicators: [],
  };
  for (const { section, items } of selectSections(cv)) {
    const history = isHistorySection(section.type);
    for (const item of items) noteItem(facts, item, history, cv.display);
  }
  return facts;
}

/** A locale-aware "A, B and C" (the `unit` list type has no separator at all in
 *  the CJK locales, so the conjunction form is the one that reads everywhere). */
function listOf(labels: string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(labels);
}

/** The provenance legend line with the source names actually shown filled in.
 *  When no listed mark names a source (every mark is owner-entered / claimed / an
 *  identifier match, each explained on its own line) the parenthetical goes. */
function provenanceLine(s: RenderStrings, sources: string[], locale: string): string {
  if (sources.length === 0) return s.readerLegendProvenance.replace(/\s?[(（]\{sources\}[)）]/, "");
  return s.readerLegendProvenance.replace("{sources}", listOf(sources, locale));
}

/**
 * The print-visible legend under the notice, built from what THIS render shows
 * (`legendFacts`) so it can never describe a mark the page does not carry: the
 * per-entry provenance mark with the source names actually on the page; one line
 * per mark that is not a plain source name (owner-entered, owner-claimed by DOI,
 * or — on an owner-side render only, the public projection strips the match
 * basis — an identifier match); then the Verified / Retracted / Open-access
 * badges and the per-work indicator pills, each only when at least one entry
 * shows it. Every explanation is the SAME string the mark's or badge's `title`
 * already carries (`itemProvenance.ts`, the badge builders in `render/html.ts`,
 * `workIndicators.ts`) — on paper the tooltips are gone, so the legend repeats
 * them once, in a place that prints. On the public page this is at most six
 * lines (the only non-source mark there is "Manual"). "" when nothing is shown.
 */
function readerLegendHtml(cv: CanonicalCv, s: RenderStrings): string {
  const locale = cv.display.locale;
  const f = legendFacts(cv);
  const pair = (label: string, text: string): string =>
    `<li><b>${escapeHtml(label)}</b> — ${escapeHtml(text)}</li>`;
  const lines: string[] = [];
  if (f.marked) lines.push(`<li>${escapeHtml(provenanceLine(s, f.sources, locale))}</li>`);
  for (const mark of f.special) lines.push(pair(mark.label, mark.title));
  if (f.verified) lines.push(pair(s.badgeVerified, s.badgeVerifiedTitle));
  if (f.retracted) lines.push(pair(s.badgeRetracted, s.badgeRetractedTitle));
  if (f.oaStatuses.length) {
    const title = s.badgeOpenAccessTitle.replace("{status}", listOf(f.oaStatuses, locale));
    lines.push(pair(s.badgeOpenAccess, title));
  }
  if (f.indicators.length) {
    const label = f.indicators.map((i) => i.label).join(" · ");
    lines.push(pair(label, f.indicators.map((i) => i.title).join(" ")));
  }
  if (lines.length === 0) return "";
  return `<div class="cv-readerlegend"><span class="cv-readerlegend-label">${escapeHtml(
    s.readerLegendLabel,
  )}</span><ul class="cv-readerlegend-list">${lines.join("")}</ul></div>`;
}

/**
 * The banner at the top of the READER view: the lead line (what the view shows,
 * and that nothing in it is a score) with a link back to the standard page
 * keeping the active filters, then the recipient notice, then the print legend
 * for the marks this render shows. `cv` is the reader-view CV of the VIEW being
 * rendered (`readerViewCv` of the filtered document): the legend is derived from
 * it, and the banner speaks its language. Styled by `commonCss`
 * (`.cv-readerbanner`); the banner PRINTS (only the back link is web-only), so
 * the notice and legend reach the paper / PDF copy an assessor keeps. Every
 * route that renders the reader view injects this one function, so the banner
 * is identical wherever the view is served.
 */
export function readerViewBannerHtml(
  cv: CanonicalCv,
  filters: ViewFilters,
  opts: {
    /** false → no "back to the standard page" link: the page IS the reader view
     *  (a version frozen as such has no standard counterpart). Default true. */
    backLink?: boolean;
  } = {},
): string {
  const s = renderStrings(cv.display.locale);
  const back = escapeHtml(viewFilterQuery(filters));
  const backLink =
    opts.backLink === false ? "" : `<a href="${back}">${escapeHtml(s.readerBannerBack)}</a>`;
  return (
    `<aside class="cv-readerbanner" role="note"><p class="cv-readerbanner-lead">${escapeHtml(
      s.readerBannerText,
    )}${backLink}</p>` +
    recipientNoticeHtml(s) +
    readerLegendHtml(cv, s) +
    `</aside>`
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
