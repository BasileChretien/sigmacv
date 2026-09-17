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

/** A bare http(s) run inside an entry line — the same shape `latex.ts` looks for. */
const MD_URL_RE = /(https?:\/\/\S+)/g;

/**
 * {@link escapeMarkdown} for an ENTRY LINE, which may carry a URL printed in
 * full (an entry's own link, a dataset's DOI, a software repository) — those
 * runs are left RAW.
 *
 * Escaping the whole line corrupts them: `_` is escaped everywhere, so
 * `https://example.org/team_page` was exported as `…/team\_page`. It RENDERS
 * correctly (a Markdown processor turns `\_` back into `_`), but the point of
 * printing a URL in a text export is that it can be read and copied out of the
 * file itself, and a backslash in the middle of it breaks that. Underscores are
 * ordinary in team-page and CMS URLs, so this is the common case, not an edge.
 *
 * The URL run keeps every character a URL legitimately carries (`_ * [ ]` and
 * the rest) and loses only the four that would break the surrounding structure
 * and never appear unencoded in a real URL: a backtick (it would open a code
 * span and swallow the rest of the line), a backslash, and `<` `>`. That is the
 * same trade `sanitizeUrlForLatex` makes against what would close a LaTeX
 * `\url{}` argument early.
 */
/**
 * A URL for a Markdown link DESTINATION written in the angle-bracket form
 * (`[label](<url>)`). `safeHref` vets the scheme, not the characters: a `>`
 * would end the destination early and let whatever follows read as Markdown (a
 * second link, with any scheme). Percent-encode the characters that can break
 * the form — angle brackets, parentheses, backslash, whitespace — leaving the
 * rest of the URL as the user wrote it.
 */
export function markdownHref(href: string): string {
  // Explicit codes: encodeURIComponent leaves "(" and ")" as they are.
  return href.replace(
    /[<>()\\\s]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
}

export function escapeMarkdownEntry(s: string): string {
  return s
    .split(MD_URL_RE)
    .map((part) =>
      /^https?:\/\//.test(part) ? part.replace(/[`\\<>]/g, "") : escapeMarkdown(part),
    )
    .join("");
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
 *
 * The userinfo class is `[^/?#]*` (NOT `[^/?#@]*`): it must match greedily up to the
 * LAST `@` in the authority, so a password that itself contains `@` (e.g.
 * `https://user:pa@ss@host/p`) is stripped in full rather than leaving `ss@host`. A
 * `/?#` still bounds the authority, so an `@` in the path/query is never touched.
 */
export function displayUrl(url: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/?#]*@/i, "$1");
}
