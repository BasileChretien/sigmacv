import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { escapeHtml } from "@/lib/render/escape";
import { renderStrings } from "@/lib/i18n/render";

/**
 * Server-side "filtered view" of a public living CV (`/p/[slug]?since=…&oa=1`).
 * The strict no-JS public-page CSP rules out client-side filtering, so the route
 * narrows the (already public-projected) CV here before rendering and shows a small
 * facet bar of links that set the same query params. Pure + immutable.
 *
 * Engine supports `since` (min year), `type` (CSL/OpenAlex type token) and `oa`
 * (open-access only); the rendered bar surfaces year cutoffs + open-access (the
 * facets that need no per-type label catalogue — `type` stays URL-addressable).
 */

export interface ViewFilters {
  /** Minimum publication year (inclusive). */
  since?: number;
  /** Exact `meta.type` token (e.g. "article", "preprint"). URL-addressable. */
  type?: string;
  /** Open-access works only. */
  oa?: boolean;
}

/** Citation sections the filters apply to (others are never narrowed). */
const CITATION_SECTIONS = new Set(["publications", "preprints", "datasets", "conference"]);

/** Parse + validate filters from a request's query params (defensive: bad values
 *  are ignored, never thrown). */
export function parseViewFilters(params: URLSearchParams): ViewFilters {
  const f: ViewFilters = {};
  const since = Number.parseInt(params.get("since") ?? "", 10);
  if (Number.isInteger(since) && since >= 1000 && since <= 9999) f.since = since;
  const type = params.get("type");
  if (type && /^[a-z][a-z-]{0,39}$/i.test(type)) f.type = type.toLowerCase();
  if (params.get("oa") === "1") f.oa = true;
  return f;
}

/** Whether any filter is active (an inactive filter renders the CV unchanged). */
export function isFilterActive(f: ViewFilters): boolean {
  return f.since !== undefined || f.type !== undefined || f.oa === true;
}

function keepItem(it: CvItem, f: ViewFilters): boolean {
  if (!it.csl) return true; // never filter non-citation entries
  if (f.since !== undefined && (it.meta.year ?? 0) < f.since) return false;
  if (f.type !== undefined && (it.meta.type ?? "").toLowerCase() !== f.type) return false;
  if (f.oa === true && it.meta.oaIsOpen !== true) return false;
  return true;
}

/**
 * Narrow a public-projected CV to a view: drop citation items outside the filters.
 * Non-citation sections are untouched. Returns the input unchanged when no filter
 * is active. Pure + immutable.
 */
export function filterCvForView(cv: CanonicalCv, f: ViewFilters): CanonicalCv {
  if (!isFilterActive(f)) return cv;
  return {
    ...cv,
    sections: cv.sections.map((s) =>
      CITATION_SECTIONS.has(s.type) ? { ...s, items: s.items.filter((it) => keepItem(it, f)) } : s,
    ),
  };
}

/** The facets actually present in the CV: a couple of year cutoffs (relative to
 *  the most recent work) and whether any work is open access. */
export function viewFilterFacets(cv: CanonicalCv): { years: number[]; hasOa: boolean } {
  let max = 0;
  let hasOa = false;
  for (const s of cv.sections) {
    if (!CITATION_SECTIONS.has(s.type)) continue;
    for (const it of s.items) {
      if (!it.csl) continue;
      if (typeof it.meta.year === "number" && it.meta.year > max) max = it.meta.year;
      if (it.meta.oaIsOpen === true) hasOa = true;
    }
  }
  const years: number[] = [];
  if (max > 0) {
    for (const back of [4, 9]) {
      const cutoff = max - back;
      if (cutoff > 1900) years.push(cutoff);
    }
  }
  return { years, hasOa };
}

/** Serialize filters back to a query string (`?since=…&oa=1`), or "?" when empty
 *  (so a chip can always clear the params). */
function queryString(f: ViewFilters): string {
  const p = new URLSearchParams();
  if (f.since !== undefined) p.set("since", String(f.since));
  if (f.type !== undefined) p.set("type", f.type);
  if (f.oa) p.set("oa", "1");
  const s = p.toString();
  return s ? `?${s}` : "?";
}

/**
 * The server-rendered facet bar: links that toggle one dimension while preserving
 * the others. "" when there's nothing meaningful to filter. Injected by the public
 * route just above the sections; styled by `commonCss` (`.cv-filterbar`).
 */
export function viewFilterBarHtml(cv: CanonicalCv, f: ViewFilters, locale: string): string {
  const { years, hasOa } = viewFilterFacets(cv);
  if (years.length === 0 && !hasOa) return "";
  const s = renderStrings(locale);
  const chip = (label: string, next: ViewFilters, active: boolean): string =>
    `<a href="${escapeHtml(queryString(next))}"${active ? ' aria-current="true"' : ""}>${escapeHtml(
      label,
    )}</a>`;
  const parts: string[] = [`<span class="cv-filter-label">${escapeHtml(s.filterLabel)}</span>`];
  // Year group: "All" clears the cutoff; each cutoff sets `since`.
  parts.push(chip(s.filterAll, { ...f, since: undefined }, f.since === undefined));
  for (const y of years) {
    parts.push(chip(s.filterSince.replace("{year}", String(y)), { ...f, since: y }, f.since === y));
  }
  // Access: an open-access toggle (preserves the active year).
  if (hasOa) {
    parts.push(chip(s.filterOpenAccess, { ...f, oa: f.oa ? undefined : true }, f.oa === true));
  }
  return `<nav class="cv-filterbar" aria-label="${escapeHtml(s.filterLabel)}">${parts.join("")}</nav>`;
}
