import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { escapeHtml } from "@/lib/render/escape";
import { renderStrings, type RenderStrings } from "@/lib/i18n/render";

/**
 * Server-side "filtered view" of a public living CV (`/p/[slug]?since=…&oa=1`).
 * The strict no-JS public-page CSP rules out client-side filtering, so the route
 * narrows the (already public-projected) CV here before rendering and shows a small
 * facet bar of links that set the same query params. Pure + immutable.
 *
 * Engine supports `since` (min year), `type` (a bucketed work-type facet) and `oa`
 * (open-access only); the rendered bar surfaces year cutoffs, work-type chips
 * (Articles / Preprints / … — only the buckets actually present), and open-access.
 */

export interface ViewFilters {
  /** Minimum publication year (inclusive). */
  since?: number;
  /** A work-type BUCKET key (article/preprint/review/conference/book/dataset). */
  type?: string;
  /** Open-access works only. */
  oa?: boolean;
}

/** Citation sections the filters apply to (others are never narrowed). */
const CITATION_SECTIONS = new Set(["publications", "preprints", "datasets", "conference"]);

/**
 * Work-type FACETS: a small, stable set of buckets that collapse OpenAlex's many raw
 * `type` tokens (and Crossref synonyms) into a handful of meaningful filters, in the
 * order they appear in the bar. The bucket KEY is what rides `?type=`; matching is by
 * bucket membership, so synonyms ("posted-content" ≈ "preprint", "book-chapter" ≈
 * "book") collapse cleanly and an unknown/rare type simply gets no chip.
 */
const TYPE_BUCKETS: ReadonlyArray<{ key: string; raw: ReadonlySet<string> }> = [
  { key: "article", raw: new Set(["article", "journal-article", "article-journal"]) },
  { key: "preprint", raw: new Set(["preprint", "posted-content"]) },
  { key: "review", raw: new Set(["review"]) },
  { key: "conference", raw: new Set(["proceedings-article", "paper-conference", "conference"]) },
  {
    key: "book",
    raw: new Set(["book", "book-chapter", "chapter", "monograph", "reference-entry"]),
  },
  { key: "dataset", raw: new Set(["dataset"]) },
];
const TYPE_KEYS: ReadonlySet<string> = new Set(TYPE_BUCKETS.map((b) => b.key));

/** The work-type bucket a raw `meta.type` token belongs to, or undefined. */
function bucketOf(rawType: string | undefined): string | undefined {
  if (!rawType) return undefined;
  const t = rawType.toLowerCase();
  for (const b of TYPE_BUCKETS) if (b.raw.has(t)) return b.key;
  return undefined;
}

/** Localized chip label for a work-type bucket key. */
function typeLabel(s: RenderStrings, key: string): string {
  switch (key) {
    case "article":
      return s.filterTypeArticle;
    case "preprint":
      return s.filterTypePreprint;
    case "review":
      return s.filterTypeReview;
    case "conference":
      return s.filterTypeConference;
    case "book":
      return s.filterTypeBook;
    default:
      return s.filterTypeDataset; // "dataset"
  }
}

/** Parse + validate filters from a request's query params (defensive: bad values
 *  are ignored, never thrown). */
export function parseViewFilters(params: URLSearchParams): ViewFilters {
  const f: ViewFilters = {};
  const since = Number.parseInt(params.get("since") ?? "", 10);
  if (Number.isInteger(since) && since >= 1000 && since <= 9999) f.since = since;
  const type = params.get("type")?.toLowerCase();
  if (type && TYPE_KEYS.has(type)) f.type = type;
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
  if (f.type !== undefined && bucketOf(it.meta.type) !== f.type) return false;
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

/** The facets actually present in the CV: a couple of year cutoffs (relative to the
 *  most recent work), the work-type buckets present (in canonical order), and whether
 *  any work is open access. */
export function viewFilterFacets(cv: CanonicalCv): {
  years: number[];
  types: string[];
  hasOa: boolean;
} {
  let max = 0;
  let hasOa = false;
  const present = new Set<string>();
  for (const s of cv.sections) {
    if (!CITATION_SECTIONS.has(s.type)) continue;
    for (const it of s.items) {
      if (!it.csl) continue;
      if (typeof it.meta.year === "number" && it.meta.year > max) max = it.meta.year;
      if (it.meta.oaIsOpen === true) hasOa = true;
      const bucket = bucketOf(it.meta.type);
      if (bucket) present.add(bucket);
    }
  }
  const years: number[] = [];
  if (max > 0) {
    for (const back of [4, 9]) {
      const cutoff = max - back;
      if (cutoff > 1900) years.push(cutoff);
    }
  }
  // Buckets in their canonical order, restricted to those actually present.
  const types = TYPE_BUCKETS.map((b) => b.key).filter((k) => present.has(k));
  return { years, types, hasOa };
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
  const { years, types, hasOa } = viewFilterFacets(cv);
  if (years.length === 0 && types.length === 0 && !hasOa) return "";
  const s = renderStrings(locale);
  const chip = (label: string, next: ViewFilters, active: boolean): string =>
    `<a href="${escapeHtml(queryString(next))}"${active ? ' aria-current="true"' : ""}>${escapeHtml(
      label,
    )}</a>`;
  const parts: string[] = [`<span class="cv-filter-label">${escapeHtml(s.filterLabel)}</span>`];
  // Year group (only when there are cutoffs to offer): "All" clears the cutoff,
  // each cutoff sets `since`.
  if (years.length) {
    parts.push(chip(s.filterAll, { ...f, since: undefined }, f.since === undefined));
    for (const y of years) {
      parts.push(
        chip(s.filterSince.replace("{year}", String(y)), { ...f, since: y }, f.since === y),
      );
    }
  }
  // Work-type chips: each toggles its bucket (active → clear), preserving year/oa.
  for (const tk of types) {
    parts.push(
      chip(typeLabel(s, tk), { ...f, type: f.type === tk ? undefined : tk }, f.type === tk),
    );
  }
  // Access: an open-access toggle (preserves the active year/type).
  if (hasOa) {
    parts.push(chip(s.filterOpenAccess, { ...f, oa: f.oa ? undefined : true }, f.oa === true));
  }
  return `<nav class="cv-filterbar" aria-label="${escapeHtml(s.filterLabel)}">${parts.join("")}</nav>`;
}
