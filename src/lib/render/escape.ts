/**
 * HTML/XML text escaper. Single source of truth — used by the HTML template,
 * the section preparer, and the SVG charts (escaping quotes too is correct for
 * SVG attribute values like aria-label).
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape user free-text so it can't trigger Markdown formatting/structure when
 * emitted into a `.md` document. Single source of truth for every text renderer
 * (markdown / biosketch / grant-CV).
 *
 * Escapes:
 *  - inline emphasis/code/link characters anywhere: `\` `` ` `` `*` `_` `[` `]`
 *  - a LEADING `#` (per line) so a body like "# Not a heading" can't become an
 *    actual heading and change the document's block structure.
 *
 * Conservative on purpose — it does NOT escape every Markdown metacharacter
 * (e.g. `.`/`-`/`>`), only those that change meaning here, so ordinary prose,
 * citations and URLs render unchanged.
 */
export function escapeMarkdown(s: string): string {
  return (
    s
      .replace(/([\\`*_[\]])/g, "\\$1")
      // A run of '#' at the very start of a line would otherwise become a heading.
      .replace(/^(\s*)(#+)/gm, "$1\\$2")
  );
}

/**
 * Sanitize a user-supplied URL for use in an `href`. Only http(s) and mailto
 * are allowed; everything else (notably `javascript:` / `data:` / `vbscript:`)
 * returns "" so the caller omits the link. Defends against XSS via stored
 * profile links — the canonical document is user-controlled data, not trusted.
 */
export function safeHref(url: string | undefined | null): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  let candidate: string;
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u)) candidate = u;
  // A bare domain/path with no scheme → treat as https.
  else if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/|$)/i.test(u)) candidate = `https://${u}`;
  else return "";
  // Strip any userinfo (`user:pass@`) from an http(s) authority so a credential
  // a user pasted into a profile link can't leak into an href on the public page
  // or a LaTeX `\url{}`. Only rewrite when userinfo is actually present, so URL
  // normalization never alters otherwise-fine links.
  if (/^https?:\/\/[^/?#@]*@/i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      parsed.username = "";
      parsed.password = "";
      candidate = parsed.toString();
    } catch {
      return "";
    }
  }
  return candidate;
}

/**
 * Strip any `user:pass@` userinfo from a URL before it is DISPLAYED as text — the
 * visible contact line, and the plain Markdown / LaTeX / DOCX exports. The href
 * path is already protected by {@link safeHref}; this guards the VISIBLE text so a
 * credential a user pasted into a profile link / website can't leak into the
 * rendered or exported CV. Total: a URL without userinfo (or a plain text label,
 * or a `mailto:` with no `//`) is returned unchanged.
 */
export function displayUrl(url: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/?#@]*@/i, "$1");
}
