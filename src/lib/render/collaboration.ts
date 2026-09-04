import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { countableWorks } from "./countable";
import { escapeHtml } from "./escape";

/**
 * COLLABORATION BREADTH — a description of WHERE the owner's co-authors are,
 * from the per-work authorship countries OpenAlex records (`meta.countries`,
 * ISO-3166 alpha-2). Opt-in (`display.showCollaboration`, default off) and
 * shown as one line in the research-summary block, beside the output ledger
 * and the authorship table. It describes the corpus (how many countries appear
 * on the author lists, what share of works span at least two), not the person:
 * nothing here is ranked, weighted or turned into a score, and the line always
 * carries its basis ("OpenAlex affiliation data; n = …") so a reader knows it
 * rests on institutional affiliations, which OpenAlex resolves only for a
 * subset of authorships. No map, no chart — a sentence.
 */
export interface CollaborationBreadth {
  /** Countable works carrying at least one country (the denominator). */
  works: number;
  /** Distinct countries across those works' author lists. */
  countries: number;
  /** Share (0..1) of those works whose author list spans ≥ 2 countries. */
  internationalShare: number;
  /** The five most frequent countries by work count (ties: alphabetical code). */
  topCountries: ReadonlyArray<{ code: string; works: number }>;
}

const TOP_N = 5;

/**
 * Breadth over the countable works with country data, or undefined when none
 * carry it (a CV synced before the field existed).
 */
export function collaborationBreadth(cv: CanonicalCv): CollaborationBreadth | undefined {
  const perCountry = new Map<string, number>();
  let works = 0;
  let international = 0;
  for (const w of countableWorks(cv)) {
    const codes = [...new Set((w.meta.countries ?? []).map((c) => c.toUpperCase()))];
    if (codes.length === 0) continue;
    works += 1;
    if (codes.length >= 2) international += 1;
    for (const c of codes) perCountry.set(c, (perCountry.get(c) ?? 0) + 1);
  }
  if (works === 0) return undefined;
  const topCountries = [...perCountry.entries()]
    .map(([code, n]) => ({ code, works: n }))
    .sort((a, b) => b.works - a.works || a.code.localeCompare(b.code))
    .slice(0, TOP_N);
  return {
    works,
    countries: perCountry.size,
    internationalShare: international / works,
    topCountries,
  };
}

/**
 * Localised country name for an ISO alpha-2 code via `Intl.DisplayNames`, the
 * bare code when the runtime has no name for it (or no DisplayNames at all).
 */
export function countryName(code: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "region", fallback: "code" }).of(code);
    return name || code;
  } catch {
    return code;
  }
}

/** Locale-aware "a, b, and c" list; a plain ", " join if ListFormat is missing. */
function joinList(parts: readonly string[], locale: string): string {
  try {
    return new Intl.ListFormat(locale, { type: "conjunction", style: "long" }).format(parts);
  } catch {
    /* v8 ignore next -- Node always ships Intl.ListFormat; fallback for exotic runtimes */
    return parts.join(", ");
  }
}

/**
 * The one-line HTML for the research-summary block: "" unless
 * `display.showCollaboration` is on AND at least one countable work carries
 * country data. Format:
 *   Co-authors from 14 countries · 62% of works international — most often
 *   Japan, France, … · based on OpenAlex affiliation data; n = 42
 */
export function collaborationHtml(cv: CanonicalCv): string {
  if (!cv.display.showCollaboration) return "";
  const b = collaborationBreadth(cv);
  if (!b) return "";
  const locale = cv.display.locale;
  const s = renderStrings(locale);
  const numFmt = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
    b.internationalShare,
  );
  const main = (b.countries === 1 ? s.collabLineOne : s.collabLine)
    .replace("{countries}", numFmt.format(b.countries))
    .replace("{pct}", pct);
  const names = b.topCountries.map((c) => countryName(c.code, locale));
  const top = s.collabTop.replace("{list}", joinList(names, locale));
  const context = s.collabContext.replace("{n}", numFmt.format(b.works));
  return (
    `<p class="cv-collab"><span class="cv-collab-main">${escapeHtml(main)}</span>` +
    ` <span class="cv-collab-top">— ${escapeHtml(top)}</span>` +
    ` <span class="cv-metric-context">· ${escapeHtml(context)}</span></p>`
  );
}
