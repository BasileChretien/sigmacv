/**
 * Minimal, self-contained styled HTML for the public CV route's non-200 states
 * (slug not found / unpublished, or rate-limited). The bare public route used to
 * return plain text — a dead-end with no branding or way back for a visitor who
 * followed a stale or mistyped link. This gives them a styled page and a link
 * home instead.
 *
 * No external assets (works under the route's strict CSP), `noindex`, and it
 * NEVER reflects the requested slug — every caller passes static copy. The
 * heading/message are HTML-escaped anyway, so the helper stays injection-safe
 * even if a future caller passes dynamic text.
 */
import { escapeHtml } from "@/lib/render/escape";

const NOTICE_CSS =
  "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:34rem;margin:18vh auto 4rem;padding:0 1.25rem;color:#1f2430;line-height:1.55}" +
  "h1{font-size:1.45rem;margin:0 0 .5rem;color:#1a1d23}" +
  "p{color:#5d646f;margin:0 0 1.25rem}" +
  "a{color:#1f4fd8;text-decoration:underline;text-underline-offset:.15em;font-weight:600}" +
  ".brand{font-size:.8rem;letter-spacing:.05em;text-transform:uppercase;color:#6b7280;margin:0 0 1.5rem}";

/** Build the full notice document. `heading`/`message` are escaped for defense in
 *  depth (callers pass static copy today). */
export function publicNoticeHtml(heading: string, message: string): string {
  const h = escapeHtml(heading);
  const m = escapeHtml(message);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${h} — SigmaCV</title><style>${NOTICE_CSS}</style></head><body><p class="brand">SigmaCV</p><h1>${h}</h1><p>${m}</p><p><a href="/">Go to SigmaCV →</a></p></body></html>`;
}

/**
 * A styled-HTML notice Response carrying the same privacy/noindex headers as the
 * public route (no-store, noindex, nosniff, no-referrer, no-script CSP). Extra
 * headers (e.g. `Retry-After`) merge on top.
 */
export function publicNoticeResponse(
  status: number,
  heading: string,
  message: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(publicNoticeHtml(heading, message), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
      // Mirror the hardened anti-framing posture of publicPageResponse so these
      // error pages can't be iframed for clickjacking / UI-redress.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders,
    },
  });
}
