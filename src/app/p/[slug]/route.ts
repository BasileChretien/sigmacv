import { NextResponse } from "next/server";
import { getPublicCvForPage } from "@/lib/cv/sync";
import {
  getCachedPublicPage,
  isKnownMiss,
  rememberMiss,
  setCachedPublicPage,
} from "@/lib/cv/publicPageCache";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { renderCvHtml } from "@/lib/render/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Anonymous + render-heavy: bound per-IP request rate so a flood (especially of
// random/invalid slugs, which bypass the render cache) can't pin the process.
const PUBPAGE_MAX = 120;
const PUBPAGE_WINDOW_MS = 60_000; // 1 minute
// A second, GLOBAL ceiling across all IPs — bounds a distributed flood that
// rotates source IPs (each IP staying under the per-IP cap).
const PUBPAGE_GLOBAL_MAX = 3_000;
const PUBPAGE_GLOBAL_WINDOW_MS = 60_000;

/**
 * Real client IP from the proxy headers. Caddy is configured to OVERWRITE
 * X-Forwarded-For with the real peer (`header_up X-Forwarded-For {remote_host}`),
 * so the trusted value is the RIGHTMOST hop — never the leftmost client-supplied
 * one (which would let an attacker rotate it to evade the per-IP limit).
 */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Build the public-page HTTP response with the hardened security headers. */
function publicPageResponse(html: string, indexable: boolean): NextResponse {
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Indexing requires the owner's explicit, separate opt-in. Without it the
      // page stays noindex so names/ORCID/publications don't enter search
      // engines on a blanket publish toggle (GDPR/APPI).
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, nofollow",
      // Personal data + a living page: never cache in a shared/CDN layer so an
      // unpublish/unindex takes effect immediately. (In-process render caching
      // is separate and slug-invalidated on publish-state changes.)
      "Cache-Control": "private, no-store",
      // Defence-in-depth as an HTTP header (stronger than the in-document meta
      // CSP, and able to set frame-ancestors). Mirrors the document's policy:
      // no scripts, inline styles only, data: images; never framed.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      // Don't leak the unguessable capability slug to external links via Referer.
      "Referrer-Policy": "no-referrer",
    },
  });
}

/**
 * Public, living CV page. Serves the self-contained CV HTML document (its own
 * styles + CSP) for a published slug. Returns 404 if the slug is unknown or
 * the owner has unpublished it.
 *
 * Indexing is a SEPARATE per-CV opt-in (publicIndexable): by default the page
 * is noindex (publishing only shares a capability URL); when the owner opts in,
 * we allow indexing and embed ProfilePage/Person JSON-LD for rich results.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const tooMany = (retryAfterSec: number) =>
    new NextResponse("Too many requests. Please try again shortly.", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  const rl = await enforceRateLimit(`pubpage:${clientIp(req)}`, PUBPAGE_MAX, PUBPAGE_WINDOW_MS);
  if (!rl.ok) return tooMany(rl.retryAfterSec);
  const grl = await enforceRateLimit("pubpage:global", PUBPAGE_GLOBAL_MAX, PUBPAGE_GLOBAL_WINDOW_MS);
  if (!grl.ok) return tooMany(grl.retryAfterSec);

  // Serve a recently-rendered page without re-reading/parsing/rendering. Only
  // published 200s are ever cached, and publish-state changes invalidate the
  // slug, so this can't serve an unpublished page.
  const cached = getCachedPublicPage(slug);
  if (cached) {
    return publicPageResponse(cached.html, cached.indexable);
  }

  const notFound = () =>
    new NextResponse("This CV is not available.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  // Negative cache: a recently-unknown slug skips the DB read (random-slug flood
  // protection). Cleared immediately when a slug is published.
  if (isKnownMiss(slug)) return notFound();

  const record = await getPublicCvForPage(slug);
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  const { cv, indexable } = record;
  let html = renderCvHtml(cv);
  if (indexable) {
    // Inject ProfilePage/Person JSON-LD into the document head for rich results.
    // It's data (not executed), so it's unaffected by the document's strict CSP.
    const jsonLd = `<script type="application/ld+json">${profilePageJsonLd(
      cv,
      slug,
    )}</script>`;
    html = html.replace("</head>", `${jsonLd}</head>`);
  }

  setCachedPublicPage(slug, { html, indexable });
  return publicPageResponse(html, indexable);
}
