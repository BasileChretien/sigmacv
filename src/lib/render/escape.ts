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
 * Sanitize a user-supplied URL for use in an `href`. Only http(s) and mailto
 * are allowed; everything else (notably `javascript:` / `data:` / `vbscript:`)
 * returns "" so the caller omits the link. Defends against XSS via stored
 * profile links — the canonical document is user-controlled data, not trusted.
 */
export function safeHref(url: string | undefined | null): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u)) return u;
  // A bare domain/path with no scheme → treat as https.
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/|$)/i.test(u)) return `https://${u}`;
  return "";
}
