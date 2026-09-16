import type { CiteprocOutputFormat } from "@/lib/citeproc/engine";

/**
 * Append a mark (the FRQ's asterisk) after given printed names inside a rendered
 * bibliography entry, in the HTML or the plain-text output of citeproc. The
 * DECISION of which names comes from `canonical/supervisees.ts`; this only marks
 * the already-known forms. Variants are matched longest first, at Unicode word
 * boundaries (so "Li" is not marked inside "Library"), never inside an HTML tag,
 * and never twice (a name already followed by the mark is left alone as a whole,
 * so its family name is not marked a second time on its own).
 */

const MARK = "*";
// Private-use delimiters that stand in for an already-marked name while the
// text is processed; they never occur in citeproc output.
const STASH_OPEN = "";
const STASH_CLOSE = "";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function alternatives(variants: string[]): string | null {
  const cleaned = [...new Set(variants.map((v) => v.trim()).filter((v) => v.length >= 2))].sort(
    (a, b) => b.length - a.length,
  );
  return cleaned.length ? cleaned.map(escapeRegExp).join("|") : null;
}

/**
 * Mark the names in one run of plain text. Longest form first, so "Kaur, P."
 * wins over "Kaur". The lookahead refuses a following letter or digit (no mark
 * inside a longer word) and a period (so the bare-initial form "Kaur, P" cannot
 * match the front of "Kaur, P."). A name already followed by the mark is set
 * aside whole before matching, so neither it nor its family name is marked again.
 */
function markRun(text: string, alts: string, mark: string): string {
  const stash: string[] = [];
  const already = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts})${escapeRegExp(mark)}`, "gu");
  const protectedText = text.replace(already, (m) => {
    stash.push(m);
    return `${STASH_OPEN}${stash.length - 1}${STASH_CLOSE}`;
  });
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${alts})(?![\\p{L}\\p{N}.])`, "gu");
  const marked = protectedText.replace(re, `$1${mark}`);
  return stash.length
    ? marked.replace(
        new RegExp(`${STASH_OPEN}(\\d+)${STASH_CLOSE}`, "g"),
        (_, n) => stash[Number(n)]!,
      )
    : marked;
}

/** Plain text: "Kaur, P." → "Kaur, P.*". */
export function appendAfterNamesText(text: string, variants: string[], mark = MARK): string {
  const alts = alternatives(variants);
  return alts ? markRun(text, alts, mark) : text;
}

/** HTML: the same, substituting only inside text runs, never inside tags. */
export function appendAfterNamesHtml(html: string, variants: string[], mark = MARK): string {
  const alts = alternatives(variants);
  if (!alts) return html;
  if (!html.includes("<")) return markRun(html, alts, mark);
  return html
    .split(/(<!--[\s\S]*?-->|<[^>]+>)/g)
    .map((segment) => (segment.startsWith("<") ? segment : markRun(segment, alts, mark)))
    .join("");
}

/** The supervisee mark for a citeproc entry in either output format. */
export function markSuperviseeNames(
  entry: string,
  variants: string[],
  outputFormat: CiteprocOutputFormat,
): string {
  if (variants.length === 0) return entry;
  return outputFormat === "html"
    ? appendAfterNamesHtml(entry, variants)
    : appendAfterNamesText(entry, variants);
}
