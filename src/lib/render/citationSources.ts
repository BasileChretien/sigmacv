/**
 * Pure helper for the per-work citation-count badge's tooltip: when an
 * independent OpenCitations count is available alongside OpenAlex's own, the
 * tooltip breaks the two out by source ("OpenAlex 12 · OpenCitations 9") so a
 * reader sees the counts don't always agree — an honest multi-source signal.
 * The VISIBLE badge number is untouched (stays OpenAlex's); only the title
 * (tooltip) text gains the breakdown. Kept in its own module (rather than
 * inline in `render/html.ts`) so it's independently unit-testable and the
 * html.ts hunk that calls it stays a one-liner.
 */

/**
 * Build the citation-count badge's tooltip text. `baseCaveat` is the existing
 * localized caveat ("Raw citation count — not field-normalised…"); when an
 * OpenCitations count is present it's appended as a source breakdown, using
 * `locale` to format both numbers. Source names ("OpenAlex"/"OpenCitations")
 * are proper nouns and are never translated, matching how other brand source
 * names are handled elsewhere (e.g. the provenance footer).
 */
export function citationCountsTitle(
  baseCaveat: string,
  openAlexCount: number,
  openCitationsCount: number | undefined,
  locale: string,
): string {
  if (openCitationsCount === undefined) return baseCaveat;
  const fmt = new Intl.NumberFormat(locale);
  return `${baseCaveat} · OpenAlex ${fmt.format(openAlexCount)} · OpenCitations ${fmt.format(
    openCitationsCount,
  )}`;
}
