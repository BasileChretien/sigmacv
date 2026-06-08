/**
 * Identifier-driven self-name highlighting.
 *
 * The DECISION to highlight an entry is made upstream by identifier match
 * (CvItem.authoredBySelf) — never by a name string. This function only wraps
 * the already-known self name(s) inside an entry we've decided is the user's.
 *
 * Because citeproc renders names in style-specific forms ("Chrétien, B.",
 * "B. Chrétien", "Chrétien B"), the reliably-present token is the family name,
 * so `nameVariants` should include it. Variants are matched longest-first and
 * only within text (never inside HTML tags/attributes).
 */

const CLASS = "cv-self";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanVariants(variants: string[]): string[] {
  const seen = new Set<string>();
  for (const v of variants) {
    const t = v.trim();
    if (t.length >= 2) seen.add(t);
  }
  // Longest first so a full name wins over a bare family name.
  return [...seen].sort((a, b) => b.length - a.length);
}

export function highlightSelf(entryHtml: string, nameVariants: string[]): string {
  const variants = cleanVariants(nameVariants);
  if (variants.length === 0) return entryHtml;

  // Match only at Unicode word boundaries so a short surname ("Li", "Berg")
  // isn't highlighted inside a longer word ("Library", "Bergström"), while names
  // that begin/end with accented letters (Chrétien, Évora) still match. `\b` is
  // ASCII-only (it would break accented names), so use letter/number lookarounds
  // with the `u` flag instead.
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${variants.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "gu",
  );

  // Fast path: a plain-text entry (no markup/comments at all) has no tags to
  // skip, so substitute directly — equivalent to the split below, and it avoids
  // running the tag-split regex on the common no-markup citeproc output.
  if (!entryHtml.includes("<")) {
    return entryHtml.replace(pattern, `<span class="${CLASS}">$1</span>`);
  }

  // Split on HTML comments and tags so we only substitute inside text segments.
  return entryHtml
    .split(/(<!--[\s\S]*?-->|<[^>]+>)/g)
    .map((segment) => {
      if (segment.startsWith("<")) return segment;
      return segment.replace(pattern, `<span class="${CLASS}">$1</span>`);
    })
    .join("");
}
