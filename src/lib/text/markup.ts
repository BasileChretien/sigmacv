/**
 * Remove the inline typographic markup that scholarly metadata embeds in text
 * fields, BUT keep the handful of tags citeproc-js can render — so genuine
 * emphasis survives into the citeproc-rendered CV (HTML / PDF) while the
 * unsupported tags, which would otherwise leak as visible text, are dropped.
 *
 * Why this exists: JATS / Crossref deposits carry inline tags and OpenAlex
 * surfaces them verbatim. Wiley, for instance, sets "VigiBase" in small caps as
 * `<scp>VigiBase</scp>`. citeproc-js renders the tags it understands (`<i>`,
 * `<b>`, `<sup>`, `<sub>`) and ENTITY-ENCODES everything else — which is why an
 * unknown `<scp>` shows up as the literal text "<scp>VigiBase</scp>" on the page.
 * We strip those unsupported tags here (keeping their inner text) and leave the
 * renderable ones in place, so "…Analysis Using <scp>VigiBase</scp>" becomes
 * "…Analysis Using VigiBase" while "Role of <i>TP53</i>" keeps its italics.
 *
 * Kept tags are re-emitted in a normalized, ATTRIBUTE-FREE form from a fixed
 * whitelist, so handing the result to citeproc's HTML output adds no markup-
 * injection surface — strictly safer than today, which passes every tag through.
 */

/** Inline formatting tags citeproc-js renders. They never need attributes, so
 *  re-emitting just `<tag>` / `</tag>` is both faithful and safe. Anything else
 *  (`<scp>`, `<sc>`, `<span>`, JATS `<italic>`/`<bold>`, MathML, `<xref>`, …) is
 *  removed, its inner text kept. */
const CITEPROC_TAGS: ReadonlySet<string> = new Set(["i", "b", "sup", "sub"]);

/** The core HTML/XML named entities seen in scholarly text. Anything outside
 *  this set is left literal (its current behaviour — no regression). */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decode `&amp;`-style named entities and `&#945;` / `&#x3b1;` numeric ones.
 *  Unknown names and out-of-range code points are left exactly as written. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] !== "#") {
      const named = NAMED_ENTITIES[body.toLowerCase()];
      return named ?? match;
    }
    const hex = body[1] === "x" || body[1] === "X";
    const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
    // Only decode printable, in-range scalar values; leave control chars and
    // anything out of the Unicode range as the literal source text.
    if (Number.isFinite(code) && code >= 0x20 && code <= 0x10ffff) {
      try {
        return String.fromCodePoint(code);
      } catch {
        /* v8 ignore next -- the range guard above already rejects bad code points */
        return match;
      }
    }
    return match;
  });
}

/**
 * Tag matcher: `<`, an optional `/`, then a LETTER (a real tag-name start),
 * the name, any attributes, then `>`. Requiring a letter immediately after
 * `<`/`</` means a mathematical "p < 0.05" or "aged <5" (a space or digit
 * follows `<`, usually with no closing `>`) is left untouched. Captures the
 * leading slash and the tag name.
 */
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)[^<>]*>/g;

/** Remove the inline tags NOT in `keep` (their inner text stays), re-emit the
 *  kept ones normalized + attribute-free, decode entities, collapse whitespace. */
function clean(raw: string, keep: ReadonlySet<string>): string {
  const stripped = raw.replace(TAG_RE, (_match, slash: string, name: string) => {
    const tag = name.toLowerCase();
    return keep.has(tag) ? `<${slash}${tag}>` : "";
  });
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

/**
 * Strip inline markup citeproc can't render (e.g. `<scp>`), keep the tags it can
 * (`<i>`, `<b>`, `<sup>`, `<sub>`), decode the core HTML entities, and collapse
 * whitespace. Use for text fed to citeproc (the canonical `csl.title`). See the
 * module doc for the rationale.
 */
export function stripUnsupportedMarkup(raw: string): string {
  return clean(raw, CITEPROC_TAGS);
}

/** No inline tags are renderable here. */
const NO_TAGS: ReadonlySet<string> = new Set();

/**
 * Flatten ALL inline markup to plain text. Use for surfaces that read
 * `csl.title` RAW and can't render any tag — BibTeX / JSON Résumé exports, the
 * sync "what's new" banner, the editor's duplicate-comparison panel — so a kept
 * `<i>` (which citeproc would italicize, but these can't) shows as plain text
 * rather than a literal "<i>".
 */
export function stripInlineMarkup(raw: string): string {
  return clean(raw, NO_TAGS);
}
