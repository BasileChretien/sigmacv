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
