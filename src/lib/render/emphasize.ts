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

  const pattern = new RegExp(`(${cleaned.map(escapeRegExp).join("|")})`, "g");
  // String.split with a capturing group puts captures at odd indices.
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
