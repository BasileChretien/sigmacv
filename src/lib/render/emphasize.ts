/**
 * Plain-text self-name emphasis for the non-HTML renderers (Markdown, LaTeX,
 * DOCX). Like the HTML highlighter, the DECISION to emphasize is made upstream
 * by identifier match — this only marks the already-known self name(s).
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanVariants(variants: string[]): string[] {
  const seen = new Set<string>();
  for (const v of variants) {
    const t = v.trim();
    if (t.length >= 2) seen.add(t);
  }
  return [...seen].sort((a, b) => b.length - a.length); // longest first
}

export interface TextSegment {
  text: string;
  self: boolean;
}

/** Split plain text into self / non-self segments. */
export function splitSelf(text: string, variants: string[]): TextSegment[] {
  const cleaned = cleanVariants(variants);
  if (cleaned.length === 0) return [{ text, self: false }];

  // Match only at Unicode word boundaries so a short surname ("Li", "Berg") is
  // not emphasized inside a longer word ("Library", "Bergström"), while accented
  // names (Chrétien, Évora) still match. Mirrors the HTML highlighter
  // (citeproc/highlight.ts); `\b` is ASCII-only so we use letter/number
  // lookarounds with the `u` flag instead. The capturing group stays the only
  // group, so String.split still puts captures at odd indices.
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${cleaned.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "gu",
  );
  return text
    .split(pattern)
    .map((part, i) => ({ text: part, self: i % 2 === 1 }))
    .filter((seg) => seg.text.length > 0);
}

/** Wrap self segments with a formatter (e.g. `**${s}**` for Markdown). */
export function wrapSelf(text: string, variants: string[], wrap: (s: string) => string): string {
  return splitSelf(text, variants)
    .map((seg) => (seg.self ? wrap(seg.text) : seg.text))
    .join("");
}
