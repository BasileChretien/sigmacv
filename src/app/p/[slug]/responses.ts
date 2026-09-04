import { NextResponse } from "next/server";
import { publicScriptSrc } from "@/lib/render/publicScripts";

/**
 * Response builders shared by the public living page (`/p/[slug]`) and the
 * frozen-version page (`/p/[slug]/v/[token]`): the hardened HTML response and
 * the machine-format response, with one set of privacy/security headers.
 */

/** The robots tag: indexing is the owner's separate per-CV opt-in. */
function robotsTag(indexable: boolean): string {
  return indexable ? "index, follow" : "noindex, nofollow";
}

/** Build the public-page HTTP response with the hardened security headers. */
export function publicPageResponse(html: string, indexable: boolean, links?: string): NextResponse {
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // FAIR Signposting: advertise the author pid(s), typed machine
      // representations, resource type, and license in the response headers.
      ...(links ? { Link: links } : {}),
      // Indexing requires the owner's explicit, separate opt-in. Without it the
      // page stays noindex so names/ORCID/publications don't enter search
      // engines on a blanket publish toggle (GDPR/APPI).
      "X-Robots-Tag": robotsTag(indexable),
      // Personal data + a living page: never cache in a shared/CDN layer so an
      // unpublish/unindex takes effect immediately. (In-process render caching
      // is separate and slug-invalidated on publish-state changes.)
      "Cache-Control": "private, no-store",
      // Defence-in-depth as an HTTP header (stronger than the in-document meta
      // CSP, and able to set frame-ancestors). Mirrors the document's policy:
      // inline styles only, data: images + data: fonts (the bundled body font is an
      // embedded @font-face data URI); never framed. Scripts stay blocked unless the
      // page carries the one hash-pinned wave script (Hanko); publicScriptSrc() emits
      // the matching `script-src` only then, so every other page is still no-JS.
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;${publicScriptSrc(html)} frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      // Don't leak the unguessable capability slug to external links via Referer.
      "Referrer-Policy": "no-referrer",
    },
  });
}

/**
 * Machine-readable export response (JSON-LD / CSL-JSON / BibTeX / JSON). Shares
 * the HTML path's privacy headers (no-store, the same indexability-driven robots
 * tag, nosniff, no-referrer). Body + Content-Type come from the serializer; a
 * Content-Disposition filename makes a direct download land sensibly.
 */
export function machineResponse(
  serialized: { contentType: string; body: string; extension: string },
  slug: string,
  indexable: boolean,
  links?: string,
): NextResponse {
  return new NextResponse(serialized.body, {
    status: 200,
    headers: {
      "Content-Type": serialized.contentType,
      // Same FAIR Signposting typed links as the HTML page (the metadata
      // representations carry the discovery links too).
      ...(links ? { Link: links } : {}),
      "X-Robots-Tag": robotsTag(indexable),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": `inline; filename="${slug}.${serialized.extension}"`,
    },
  });
}
