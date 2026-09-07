import type { CvItem } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import type { CiteprocOutputFormat } from "@/lib/citeproc/engine";
import { escapeHtml } from "./escape";

/**
 * The "owner past the et-al cut" tail.
 *
 * Many CSL styles truncate long author lists ("Chicago" prints the first seven of
 * eleven-plus authors, "Vancouver" the first six, …) — a middle-author owner then
 * does not appear in their OWN bibliography entry, and the identifier-driven
 * self-name highlight has nothing to mark. This appends a compact, localized tail
 * after such an entry ("[incl. L. Peyro-Saint-Paul, author 9 of 12]") so the
 * account holder is always visible on their own works — in every format, via the
 * shared prepare path.
 *
 * The DECISION that the work is the owner's is made upstream by identifier match
 * (`authoredBySelf` / the identifier-derived `meta.authorPosition`); this only asks
 * whether the rendered entry still PRINTS any of the owner's known name forms
 * (`selfNameVariants` — the very forms the highlight looks for, plus the CSL author
 * at the owner's position after the publication-name substitution). No printed
 * form → the style cut the list before the owner → tail. Printed → nothing.
 */

const CLASS = "cv-self-tail";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does the entry's TEXT (never its tags/attributes) print any of the name forms? */
function printsAnyName(entry: string, variants: string[]): boolean {
  const cleaned = [...new Set(variants.map((v) => v.trim()).filter((v) => v.length >= 2))];
  if (cleaned.length === 0) return false;
  // Same boundary + case rules as the highlighter (citeproc/highlight.ts).
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${cleaned.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "iu",
  );
  const text = entry
    .split(/(<!--[\s\S]*?-->|<[^>]+>)/g)
    .filter((seg) => !seg.startsWith("<"))
    .join("");
  return pattern.test(text);
}

/** "Jean-Bernard" → "J.-B.", "Laure" → "L.", "B. J." → "B. J." */
function initials(given: string): string {
  return given
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}.`)
        .join("-"),
    )
    .join(" ");
}

/**
 * The owner's compact printed name for the tail: the CSL author at the owner's
 * position (already carrying `owner.publicationName` when set) as initials + family,
 * the way a citation style would abbreviate it. `null` when that author is absent.
 */
function ownerPrintedName(item: CvItem, index: number): { name: string; forms: string[] } | null {
  const author = item.csl?.author?.[index];
  if (!author) return null;
  const family = author.family?.trim();
  const given = author.given?.trim();
  if (family) {
    const name = given ? `${initials(given)} ${family}` : family;
    // The family name is the token every style prints, so it is the form to look for.
    return { name, forms: [family, name] };
  }
  const literal = author.literal?.trim();
  return literal ? { name: literal, forms: [literal] } : null;
}

/**
 * The tail to append after ONE rendered bibliography entry, or "" when the owner
 * is printed (or the item carries no identifier-derived position). Format-aware:
 * a muted `.cv-self-tail` span for HTML/PDF, a plain bracketed run for the text
 * formats (DOCX / Markdown / LaTeX), so all outputs agree.
 */
export function selfAuthorTail(
  item: CvItem,
  entry: string,
  locale: string,
  outputFormat: CiteprocOutputFormat,
): string {
  const position = item.meta.authorPosition ?? 0;
  const count = item.meta.authorCount ?? item.csl?.author?.length ?? 0;
  if (!entry || !item.csl || item.notMine || position < 1 || count < 2 || position > count) {
    return "";
  }
  const owner = ownerPrintedName(item, position - 1);
  if (!owner) return "";
  if (printsAnyName(entry, [...item.selfNameVariants, ...owner.forms])) return "";
  const text = `[${renderStrings(locale)
    .selfAuthorTail.replace("{name}", owner.name)
    .replace("{position}", String(position))
    .replace("{count}", String(count))}]`;
  return outputFormat === "html"
    ? ` <span class="${CLASS}">${escapeHtml(text)}</span>`
    : ` ${text}`;
}

/**
 * The entry with its tail (if any) — placed INSIDE citeproc's closing
 * `<div class="csl-entry">` wrapper for HTML, so the tail runs on from the citation
 * text (same hanging indent, same line flow) instead of dropping below the block.
 */
export function withSelfAuthorTail(
  item: CvItem,
  entry: string,
  locale: string,
  outputFormat: CiteprocOutputFormat,
): string {
  const tail = selfAuthorTail(item, entry, locale, outputFormat);
  if (!tail) return entry;
  const close = /<\/div>\s*$/.exec(entry);
  return close ? entry.slice(0, close.index) + tail + entry.slice(close.index) : entry + tail;
}
