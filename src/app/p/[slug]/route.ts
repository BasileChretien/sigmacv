import { NextResponse } from "next/server";
import { getPublicCvForPage } from "@/lib/cv/sync";
import {
  dedupePublicRender,
  getCachedPublicPage,
  isKnownMiss,
  rememberMiss,
  setCachedPublicPage,
} from "@/lib/cv/publicPageCache";
import {
  chooseFormatFromAccept,
  formatFromSlug,
  serializePublicCv,
  type PublicFormat,
} from "@/lib/cv/publicFormats";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { signpostingLinkHeader } from "@/lib/cv/signposting";
import { publicMetaTags } from "@/lib/cv/publicMeta";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import { publicScriptSrc } from "@/lib/render/publicScripts";
import {
  filterCvForView,
  isFilterActive,
  parseViewFilters,
  viewFilterBarHtml,
} from "@/lib/cv/viewFilter";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { absoluteUrl } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "./pubRateLimit";
import { publicNoticeResponse } from "./noticePage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The robots tag: indexing is the owner's separate per-CV opt-in. */
function robotsTag(indexable: boolean): string {
  return indexable ? "index, follow" : "noindex, nofollow";
}

/** Build the public-page HTTP response with the hardened security headers. */
function publicPageResponse(html: string, indexable: boolean, links?: string): NextResponse {
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
function machineResponse(
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

/**
 * Public, living CV page + its machine-readable representations.
 *
 * Format is chosen by EITHER a stable suffix on the slug (`…​.json`, `.bib`,
 * `.csl.json`, `.jsonld` — an explicit override) OR `Accept` content
 * negotiation, defaulting to the HTML page. Every format shares the same slug
 * lookup, `published` gating (404 + negative cache when not published), and rate
 * limits; the CV is run through `projectCvForPublic` before serialization.
 *
 * Indexing is a SEPARATE per-CV opt-in (publicIndexable): by default the page is
 * noindex; when the owner opts in, we allow indexing, embed ProfilePage/Person
 * JSON-LD, and the machine formats advertise the same robots state.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;

  // An explicit suffix wins over Accept; otherwise negotiate (default html).
  const suffix = formatFromSlug(rawSlug);
  const slug = suffix ? suffix.slug : rawSlug;
  const format: PublicFormat = suffix
    ? suffix.format
    : chooseFormatFromAccept(req.headers.get("accept"));

  // Server-side "filtered view" (?since=/?type=/?oa=) for the HTML page only — the
  // no-JS CSP rules out client-side filtering, so the route narrows the CV and the
  // facet bar links set these params (machine formats ignore them).
  const url = new URL(req.url);
  const filters = parseViewFilters(url.searchParams);
  const active = isFilterActive(filters);

  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const notFound = () =>
    publicNoticeResponse(
      404,
      "This CV isn't available",
      "The link may be mistyped, or the page may have been unpublished — the owner of a living CV can turn its public page off at any time.",
    );

  // Validate the stripped slug against the server-generated slug shape BEFORE
  // any DB lookup or use in the Content-Disposition header. Server slugs always
  // match; this only rejects crafted input (quotes/CRLF/path chars → header
  // injection), treating it as not-found.
  if (!isValidPublicSlug(slug)) return notFound();

  // HTML has a render cache (the heavy citeproc path). Machine formats are
  // cheaper to produce and would multiply cache keys, so they skip it. A FILTERED
  // view also skips the cache (it keys on slug alone) and renders fresh.
  if (format === "html" && !active) {
    const cached = getCachedPublicPage(slug);
    if (cached) return publicPageResponse(cached.html, cached.indexable, cached.signposting);
  }

  // Negative cache: a recently-unknown slug skips the DB read (random-slug flood
  // protection). Cleared immediately when a slug is published.
  if (isKnownMiss(slug)) return notFound();

  // resolveCoauthors: also resolve co-authors with their own public+indexable CV
  // (for the JSON-LD `knows` graph). Only this route needs it; the OG card skips it.
  const record = await getPublicCvForPage(slug, { resolveCoauthors: true });
  if (!record) {
    rememberMiss(slug);
    return notFound();
  }

  // getPublicCvForPage already returns the projectCvForPublic() projection.
  const { cv, indexable, coauthorCvs, recentlyAdded } = record;

  // FAIR Signposting typed links — same for the HTML page and every machine
  // representation served from this slug.
  const signposting = signpostingLinkHeader(cv, slug);

  if (format !== "html") {
    return machineResponse(serializePublicCv(cv, format, slug), slug, indexable, signposting);
  }

  // Build the public HTML for a given VIEW of the CV (the full doc, or a narrowed
  // one under an active filter). Public-page-only chrome — the per-publication
  // Cite/Abstract/Full-text affordance (publicExtras + slug), the "Subscribe" feed
  // link (feedHref), and the server-rendered filter bar — is added here; exporters
  // never set these opts, so PDF/DOCX/LaTeX/Markdown stay clean.
  const feedHref = absoluteUrl(`/p/${slug}/feed.xml`);
  const renderView = (viewCv: CanonicalCv): string => {
    // The living public page may use an animated showcase style (display.publicStyle);
    // "match" (default) renders with the document template. Exports never call this.
    let html = renderPublicCvHtml(viewCv, {
      attribution: true,
      coauthorCvs,
      recentlyAdded,
      publicExtras: true,
      slug,
      feedHref,
    });
    // The view-filter bar is built from the FULL CV (so every facet is always
    // reachable, even from a filtered view) and injected just above the sections —
    // one consistent anchor (`<main class="cv-main">`) across every template/style.
    const bar = viewFilterBarHtml(cv, filters, cv.display.locale);
    if (bar) html = html.replace('<main class="cv-main">', `${bar}<main class="cv-main">`);
    // SEO + OG/Twitter meta (public profile text only) into <head>: canonical +
    // og:url, a SERP description, og:image (the per-CV branded card), and the Atom
    // feed's alternate <link> so feed readers discover it.
    const head = publicMetaTags(cv, {
      imageUrl: absoluteUrl(`/p/${slug}/og`),
      pageUrl: absoluteUrl(`/p/${slug}`),
      feedUrl: feedHref,
    });
    // Inject ProfilePage/Person JSON-LD into the document head. It's DATA, not a
    // crawl permission — emit it whether or not the owner opted into indexing (the
    // X-Robots-Tag `noindex` still keeps the page out of search results). It's data
    // (not executed), so it's unaffected by the document's strict CSP.
    return html.replace(
      "</head>",
      `${head}<script type="application/ld+json">${profilePageJsonLd(cv, slug, coauthorCvs)}</script></head>`,
    );
  };

  // A FILTERED view renders fresh and is neither cached nor deduped (both key on
  // slug alone, so a filtered render must never be stored under or coalesced with
  // the plain page).
  if (active) {
    return publicPageResponse(renderView(filterCvForView(cv, filters)), indexable, signposting);
  }

  // Coalesce concurrent renders of the same (unfiltered) slug so the heavy citeproc
  // render runs once even under a burst of anonymous hits on one uncached page.
  const entry = await dedupePublicRender(slug, async () => {
    // Re-check the cache inside the critical section: a concurrent request may
    // have just rendered this slug while we awaited the DB read.
    const fresh = getCachedPublicPage(slug);
    if (fresh) return fresh;
    const rendered = { html: renderView(cv), indexable, signposting };
    setCachedPublicPage(slug, rendered);
    return rendered;
  });
  return publicPageResponse(entry.html, entry.indexable, entry.signposting);
}
