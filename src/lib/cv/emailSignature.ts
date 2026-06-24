import { escapeHtml, safeHref } from "@/lib/render/escape";

/**
 * Email-signature snippet for the "Living CV" badge.
 *
 * The three existing badge snippets (Markdown / HTML / image-URL) are copied as
 * PLAIN text — pasting them into a rich signature editor (Outlook, Gmail) shows
 * the literal source, not a rendered badge. This builder produces the **rich
 * HTML** a client copies via the async Clipboard API (`text/html` flavor) so a
 * paste inserts a real, clickable element instead of code.
 *
 * Email is a hostile rendering target, so the snippet is deliberately defensive:
 *  - **A hosted PNG, never the SVG badge.** Classic Outlook for Windows (the
 *    Word rendering engine) does not display SVG `<img>`; the email badge is
 *    served from `/p/<slug>/badge.png` instead (`badge.png` route).
 *  - **A text-link fallback beneath the image.** Mail clients block remote
 *    images by default; the visible link keeps the signature useful even when
 *    the badge never loads.
 *  - **Table-wrapped, fully inline-styled.** The shape Outlook/Word preserve
 *    when pasted into a signature box — no external CSS, no flexbox.
 *
 * PURE + tested under the gate. Untrusted text (alt / link words) and the URLs
 * are HTML-escaped before they enter the markup.
 */

/** Logical (CSS px) display size of the email badge. The PNG is rasterized at
 *  `BADGE_PNG_SCALE`× this for crispness on hi-DPI mail clients; the signature
 *  `<img>` pins width/height to these logical values. */
export const BADGE_PNG_DISPLAY = { width: 460, height: 104 } as const;
/** Hi-DPI oversampling factor for the rendered PNG (the `<img>` displays at 1×). */
export const BADGE_PNG_SCALE = 2;

/** Mirrors the schema accent default — the fallback link colour. */
const FALLBACK_ACCENT = "#1f4fd8";
/** A 3- or 6-digit hex colour (defensive validation of the accent override). */
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface EmailSignatureArgs {
  /** Absolute URL of the public living page — the badge's link target. */
  pageUrl: string;
  /** Absolute URL of the Outlook-safe PNG badge (`/p/<slug>/badge.png`). */
  badgePngUrl: string;
  /** Alt text for the badge image (localized). */
  alt: string;
  /** Visible text-fallback link words (localized, e.g. "View my living CV"). */
  linkText: string;
  /** Logical display width of the `<img>` (defaults to the badge size). */
  width?: number;
  /** Logical display height of the `<img>` (defaults to the badge size). */
  height?: number;
  /** Accent hex for the fallback link colour (falls back to the brand accent). */
  accent?: string;
}

/**
 * Build the rich `text/html` email-signature fragment: a linked PNG badge with
 * a text-link fallback line beneath it. Inline styles only; safe to drop on the
 * clipboard as a `text/html` blob.
 */
export function emailSignatureHtml(a: EmailSignatureArgs): string {
  // Scheme-allow-list (http(s) only) + strip any user:pass@ credentials before
  // escaping — defence-in-depth so a caller can never emit a javascript:/data:
  // URL or leak userinfo into the signature's href/src. An unsafe value fails
  // closed to an empty attribute.
  const href = escapeHtml(safeHref(a.pageUrl));
  const src = escapeHtml(safeHref(a.badgePngUrl));
  const alt = escapeHtml(a.alt);
  const link = escapeHtml(a.linkText);
  const width = a.width ?? BADGE_PNG_DISPLAY.width;
  const height = a.height ?? BADGE_PNG_DISPLAY.height;
  const accent = a.accent && HEX_RE.test(a.accent) ? a.accent : FALLBACK_ACCENT;
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ` +
    `style="border-collapse:collapse;border:0">` +
    `<tr><td style="padding:0;line-height:0">` +
    `<a href="${href}" target="_blank" rel="noopener noreferrer" ` +
    `style="text-decoration:none;border:0">` +
    `<img src="${src}" alt="${alt}" width="${width}" height="${height}" border="0" ` +
    `style="display:block;width:${width}px;height:${height}px;border:0;outline:none;text-decoration:none" />` +
    `</a></td></tr>` +
    `<tr><td style="padding:6px 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.3">` +
    `<a href="${href}" target="_blank" rel="noopener noreferrer" ` +
    `style="color:${accent};text-decoration:none">${link}&#160;&#8594;</a>` +
    `</td></tr>` +
    `</table>`
  );
}

/**
 * Wrap a signature fragment in a complete, minimal HTML document for use as a
 * **classic-Outlook signature FILE** (`%APPDATA%\Microsoft\Signatures\<name>.htm`).
 *
 * Outlook reads a signature `.htm` directly as the signature's source — there is
 * no clipboard paste, so the `<a>` around the badge image survives and the badge
 * stays **clickable**. (The paste path loses it: classic Outlook strips the
 * hyperlink off pasted images while keeping text links.) PURE; `bodyHtml` is the
 * already-escaped `emailSignatureHtml` fragment, so no user data is interpolated
 * here.
 */
export function outlookSignatureDocument(bodyHtml: string): string {
  return (
    `<!DOCTYPE html>\n` +
    `<html xmlns="http://www.w3.org/1999/xhtml">\n` +
    `<head>\n` +
    `<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n` +
    `<meta name="generator" content="SigmaCV" />\n` +
    `<title>Email signature</title>\n` +
    `</head>\n` +
    `<body>\n${bodyHtml}\n</body>\n` +
    `</html>\n`
  );
}
