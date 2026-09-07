import { ledgerForView } from "@/lib/cv/provenanceLedger";
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
import {
  filterCvForView,
  isFilterActive,
  parseViewFilters,
  viewFilterBarHtml,
} from "@/lib/cv/viewFilter";
import {
  READER_VIEW_KEEP,
  isReaderViewRequested,
  readerViewActive,
  readerViewBannerHtml,
  readerViewCv,
  readerViewHeadTags,
  readerViewLinkHtml,
} from "@/lib/cv/readerView";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { absoluteUrl } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "./pubRateLimit";
import { publicNoticeResponse } from "./noticePage";
import { machineResponse, publicPageResponse } from "./responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  // `?view=reader` (the assessor's reader view) is only a REQUEST here — whether it
  // is honoured depends on the owner's opt-in on the loaded CV (below). A plain
  // request for the reader view must still be able to use the standard-page cache,
  // so the cache check keys on the filters alone at this point and the reader gate
  // is re-evaluated once the record is known.
  const readerRequested = isReaderViewRequested(url.searchParams);
  const active = isFilterActive(filters) || readerRequested;

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
  const { cv, indexable, coauthorCvs, recentlyAdded, provenanceLedger } = record;

  // FAIR Signposting typed links — same for the HTML page and every machine
  // representation served from this slug.
  const signposting = signpostingLinkHeader(cv, slug);

  if (format !== "html") {
    return machineResponse(serializePublicCv(cv, format, slug), slug, indexable, signposting);
  }

  // The assessor's READER VIEW: honoured only when the owner opted in
  // (`display.allowReaderMode`); otherwise `?view=reader` is ignored and the
  // standard page is served. It applies the reader-mode display preset to the
  // projected CV and asks the renderer for the per-item provenance marks — an
  // internal render option, so no export can ever carry them.
  const reader = readerViewActive(url.searchParams, cv);

  // Build the public HTML for a given VIEW of the CV (the full doc, or a narrowed
  // one under an active filter). Public-page-only chrome — the per-publication
  // Cite/Abstract/Full-text affordance (publicExtras + slug), the "Subscribe" feed
  // link (feedHref), and the server-rendered filter bar — is added here; exporters
  // never set these opts, so PDF/DOCX/LaTeX/Markdown stay clean.
  const feedHref = absoluteUrl(`/p/${slug}/feed.xml`);
  const renderView = (viewCv: CanonicalCv): string => {
    // The living public page may use an animated showcase style (display.publicStyle);
    // "match" (default) renders with the document template. Exports never call this.
    const renderCv = reader ? readerViewCv(viewCv) : viewCv;
    let html = renderPublicCvHtml(renderCv, {
      attribution: true,
      coauthorCvs,
      recentlyAdded,
      // Computed on the STORED document before projection — the projection strips
      // the attribution/review signals the ledger counts. Its one view-dependent
      // line (retracted works shown) follows the view being rendered.
      provenanceLedger: provenanceLedger ? ledgerForView(provenanceLedger, renderCv) : undefined,
      publicExtras: true,
      slug,
      feedHref,
      readerMode: reader,
    });
    // Reader-view chrome: the banner at the top of the reader view (its legend is
    // derived from the very CV this view renders, so it explains only marks the
    // page shows), or (when the owner allows the view) the quiet "Reader view"
    // link on the standard page.
    const readerChrome = reader
      ? readerViewBannerHtml(renderCv, filters)
      : cv.display.allowReaderMode
        ? readerViewLinkHtml(filters, cv.display.locale)
        : "";
    // The view-filter bar is built from the FULL CV (so every facet is always
    // reachable, even from a filtered view) and injected just above the sections —
    // one consistent anchor (`<main class="cv-main">`) across every template/style.
    // In the reader view its chips keep `view=reader` so a facet never drops it.
    const bar = viewFilterBarHtml(
      cv,
      filters,
      cv.display.locale,
      reader ? READER_VIEW_KEEP : undefined,
    );
    if (readerChrome || bar) {
      // INSIDE <main>, before the first section — never between the template's
      // landmarks. The Sidebar template lays `<aside>` + `<main>` out as a two-column
      // grid (`265px 1fr`); a sibling injected between them took the main cell and
      // pushed the whole CV into the narrow rail column on row 2.
      html = html.replace('<main class="cv-main">', `<main class="cv-main">${readerChrome}${bar}`);
    }
    // SEO + OG/Twitter meta (public profile text only) into <head>: canonical +
    // og:url, a SERP description, og:image (the per-CV branded card), and the Atom
    // feed's alternate <link> so feed readers discover it. Built from the FULL
    // (un-preset) CV with the PLAIN page URL for every view, so the reader view's
    // canonical + social card are identical to the standard page's; the reader view
    // only adds a `noindex` robots meta (its content is the standard page's).
    const head =
      publicMetaTags(cv, {
        imageUrl: absoluteUrl(`/p/${slug}/og`),
        pageUrl: absoluteUrl(`/p/${slug}`),
        feedUrl: feedHref,
      }) + (reader ? readerViewHeadTags() : "");
    // Inject ProfilePage/Person JSON-LD into the document head. It's DATA, not a
    // crawl permission — emit it whether or not the owner opted into indexing (the
    // X-Robots-Tag `noindex` still keeps the page out of search results). It's data
    // (not executed), so it's unaffected by the document's strict CSP. Built from
    // the FULL CV, so the reader view carries the very same graph.
    return html.replace(
      "</head>",
      `${head}<script type="application/ld+json">${profilePageJsonLd(cv, slug, coauthorCvs)}</script></head>`,
    );
  };

  // A FILTERED view renders fresh and is neither cached nor deduped (both key on
  // slug alone, so a filtered render must never be stored under or coalesced with
  // the plain page). The reader view is served the same way, and always `noindex`
  // (the standard page is the canonical, indexable one).
  if (isFilterActive(filters) || reader) {
    return publicPageResponse(
      renderView(filterCvForView(cv, filters)),
      indexable && !reader,
      signposting,
    );
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
