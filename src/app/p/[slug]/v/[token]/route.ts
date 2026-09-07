import {
  getPublicSnapshot,
  isValidSnapshotToken,
  snapshotPublicPath,
} from "@/lib/cv/snapshotStore";
import { injectSnapshotChrome } from "@/lib/cv/snapshotPage";
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
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
): Promise<Response> {
  const { slug, token: rawToken } = await params;

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
  let html = renderPublicCvHtml(snap.cv, { attribution: true });
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
    locale: snap.cv.display.locale,
  });
  return publicPageResponse(html, false, signposting);
}
