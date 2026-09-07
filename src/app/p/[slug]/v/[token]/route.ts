import {
  getPublicSnapshot,
  isValidSnapshotToken,
  snapshotPublicPath,
} from "@/lib/cv/snapshotStore";
import { ledgerForView } from "@/lib/cv/provenanceLedger";
import { injectSnapshotChrome } from "@/lib/cv/snapshotPage";
import {
  readerViewActive,
  readerViewBannerHtml,
  readerViewCv,
  readerViewLinkHtml,
} from "@/lib/cv/readerView";
import { chooseFormatFromAccept, formatFromSlug, serializePublicCv } from "@/lib/cv/publicFormats";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import { publicMetaTags } from "@/lib/cv/publicMeta";
import { signpostingLinkHeader } from "@/lib/cv/signposting";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import { absoluteUrl } from "@/lib/siteUrl";
import { enforcePubPageRateLimit, isValidPublicSlug, tooManyRequests } from "../../pubRateLimit";
import { publicNoticeResponse } from "../../noticePage";
import { machineResponse, publicPageResponse } from "../../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(): Response {
  return publicNoticeResponse(
    404,
    "This version isn't available",
    "The link may be mistyped, or the owner may have made this frozen version private or unpublished their page.",
  );
}

/**
 * A PUBLIC frozen version of a living CV (`/p/<slug>/v/<token>`), served
 * through the SAME renderer and the same content negotiation as the live page
 * (`.json` / `.bib` / `.csl.json` / `.jsonld` suffix on the token, or `Accept`).
 *
 * Gating (all fail closed → 404): the slug + token shapes, the parent page
 * published under this slug, and the snapshot marked public by its owner. The
 * frozen document is public-projected at serve time exactly like the live one.
 * A snapshot is NEVER indexed: `noindex` + `<link rel="canonical">` → the
 * living page, which stays the discoverable resource. FAIR Signposting points
 * at the frozen page's own machine formats and, once minted, its DOI (`cite-as`).
 *
 * ASSESSMENT-GRADE: the provenance ledger rendered here is the one computed at
 * freeze time on the un-stripped document (`snapshotStore.createSnapshot`), never
 * one derived from the frozen copy; the content hash rides the banner and a
 * `<meta>`. The READER VIEW is served when the owner froze the version as such
 * (`readerMode`, fixed at freeze time), or — like the living page — on
 * `?view=reader` when the frozen `display.allowReaderMode` permits it.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
): Promise<Response> {
  const { slug, token: rawToken } = await params;
  const url = new URL(req.url);

  const rl = await enforcePubPageRateLimit(req);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const suffix = formatFromSlug(rawToken);
  const token = suffix ? suffix.slug : rawToken;
  const format = suffix ? suffix.format : chooseFormatFromAccept(req.headers.get("accept"));

  if (!isValidPublicSlug(slug) || !isValidSnapshotToken(token)) return notFound();

  const snap = await getPublicSnapshot(slug, token);
  if (!snap) return notFound();

  const path = snapshotPublicPath(slug, token);
  const pageUrl = absoluteUrl(path);
  const liveUrl = absoluteUrl(`p/${slug}`);
  const signposting = signpostingLinkHeader(snap.cv, slug, {
    resourcePath: path,
    citeAsDoi: snap.doi,
  });
  const jsonLdOpts = {
    url: pageUrl,
    version: snap.version,
    frozenAt: snap.createdAt,
    doi: snap.doi,
  };

  if (format !== "html") {
    const serialized =
      format === "jsonld"
        ? {
            contentType: "application/ld+json; charset=utf-8",
            extension: "jsonld",
            body: profilePageJsonLd(snap.cv, slug, [], jsonLdOpts),
          }
        : serializePublicCv(snap.cv, format, slug);
    return machineResponse(serialized, `${slug}-v${snap.version}`, false, signposting);
  }

  // The same renderer as the living page, WITHOUT the live-only chrome
  // (per-work cite links, the feed link, "what's new"): a frozen document is a
  // clean reference copy.
  const reader = snap.readerMode || readerViewActive(url.searchParams, snap.cv);
  const viewCv = reader ? readerViewCv(snap.cv) : snap.cv;
  // The stored ledger, with its view-dependent line ("retracted works shown")
  // recomputed for THIS view — the reader view forces retracted works visible.
  const ledger = snap.ledger ? ledgerForView(snap.ledger, viewCv) : undefined;
  let html = renderPublicCvHtml(viewCv, {
    attribution: true,
    provenanceLedger: ledger,
    readerMode: reader,
  });
  // Reader chrome, injected at the same anchor the living page uses: the banner on
  // the reader view (no "back" link when the version IS the reader view), or the
  // quiet "Reader view" link when the frozen display allows the view on request.
  const locale = snap.cv.display.locale;
  const readerChrome = reader
    ? readerViewBannerHtml(viewCv, {}, { backLink: !snap.readerMode })
    : snap.cv.display.allowReaderMode
      ? readerViewLinkHtml({}, locale)
      : "";
  if (readerChrome) {
    html = html.replace('<main class="cv-main">', `<main class="cv-main">${readerChrome}`);
  }
  const head = publicMetaTags(snap.cv, { imageUrl: absoluteUrl(`/p/${slug}/og`) });
  html = html.replace(
    "</head>",
    `${head}<script type="application/ld+json">${profilePageJsonLd(snap.cv, slug, [], jsonLdOpts)}</script></head>`,
  );
  html = injectSnapshotChrome(html, {
    version: snap.version,
    frozenAt: snap.createdAt,
    doi: snap.doi,
    liveUrl,
    diffUrl: absoluteUrl(`${path}/diff`),
    locale,
    contentHash: snap.contentHash,
  });
  return publicPageResponse(html, false, signposting);
}
