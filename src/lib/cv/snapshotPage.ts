import { CONTENT_HASH_SHORT_LEN } from "@/lib/cv/snapshotHash";
import { snapshotStrings } from "@/lib/i18n/snapshots";
import { escapeHtml, safeHref } from "@/lib/render/escape";
import { formatSnapshotDate } from "@/lib/render/diff";

/**
 * Page chrome for a PUBLIC frozen-version page (`/p/<slug>/v/<token>`): the
 * "this is a frozen version" banner and the head tags that tie it back to the
 * living page. The frozen CV itself is rendered by the SAME renderer as the
 * live page; this only decorates that HTML. Pure string work, inline CSS only
 * (the page ships under the strict no-script CSP).
 */
export interface SnapshotChrome {
  version: number;
  /** ISO timestamp the snapshot was frozen at. */
  frozenAt: string;
  doi?: string | null;
  /** Absolute URL of the living page (canonical + "Live version" link). */
  liveUrl: string;
  /** Absolute URL of the public diff page ("What changed since"). */
  diffUrl: string;
  locale: string;
  /** SHA-256 (hex) of the frozen document — shown short in the banner (full in
   *  its `title`) and as a `<meta>` so a link and a PDF can be matched. Absent on
   *  versions frozen before the hash was recorded. */
  contentHash?: string | null;
}

const BANNER_STYLE =
  "margin:0;padding:.6rem 1rem;font:500 .85rem/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
  "background:#fff7e6;color:#5c4400;border-bottom:1px solid #f0d9a8;text-align:center";
const LINK_STYLE =
  "color:#1f4fd8;text-decoration:underline;text-underline-offset:.15em;margin-left:.75rem";
const HASH_STYLE =
  "margin-left:.75rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8em;cursor:help";

/** `SHA-256 abcdef012345` — a proper noun + hex, so no locale string is needed. */
function contentHashHtml(hash: string): string {
  const short = hash.slice(0, CONTENT_HASH_SHORT_LEN);
  return `<span class="snapshot-hash" style="${HASH_STYLE}" title="SHA-256 ${escapeHtml(hash)}">SHA-256 ${escapeHtml(short)}</span>`;
}

/** The banner: "Frozen version v<n> · <date> · DOI · Live version · What changed since". */
export function snapshotBannerHtml(c: SnapshotChrome): string {
  const s = snapshotStrings(c.locale);
  const date = formatSnapshotDate(c.frozenAt, c.locale);
  const lead = s.bannerFrozen.split("{n}").join(String(c.version)).split("{date}").join(date);
  const parts: string[] = [`<span>${escapeHtml(lead)}</span>`];
  if (c.doi) {
    const doiUrl = `https://doi.org/${c.doi}`;
    parts.push(
      `<a style="${LINK_STYLE}" href="${escapeHtml(safeHref(doiUrl))}">${escapeHtml(doiUrl)}</a>`,
    );
  }
  parts.push(
    `<a style="${LINK_STYLE}" href="${escapeHtml(safeHref(c.liveUrl))}">${escapeHtml(s.bannerLive)}</a>`,
  );
  parts.push(
    `<a style="${LINK_STYLE}" href="${escapeHtml(safeHref(c.diffUrl))}">${escapeHtml(s.bannerCompare)}</a>`,
  );
  if (c.contentHash) parts.push(contentHashHtml(c.contentHash));
  return `<p class="snapshot-banner" role="note" style="${BANNER_STYLE}">${parts.join("")}</p>`;
}

/**
 * Decorate a rendered public-CV document as a frozen version: the banner right
 * after `<body>`, and `<link rel="canonical">` (→ the living page) + a
 * `noindex` robots meta into `<head>`. A snapshot is never indexed — the
 * living page is the canonical, discoverable resource; the frozen one is a
 * citable reference reached by its link (or DOI).
 */
export function injectSnapshotChrome(html: string, c: SnapshotChrome): string {
  const head =
    `<link rel="canonical" href="${escapeHtml(c.liveUrl)}" />` +
    `<meta name="robots" content="noindex" />` +
    (c.contentHash
      ? `<meta name="sigmacv:content-hash" content="sha256:${escapeHtml(c.contentHash)}" />`
      : "");
  const withHead = html.includes("</head>") ? html.replace("</head>", `${head}</head>`) : html;
  const banner = snapshotBannerHtml(c);
  const bodyOpen = /<body[^>]*>/i.exec(withHead);
  if (!bodyOpen) return `${banner}${withHead}`;
  const at = bodyOpen.index + bodyOpen[0].length;
  return `${withHead.slice(0, at)}${banner}${withHead.slice(at)}`;
}
