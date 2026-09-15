import type { CanonicalCv } from "@/lib/canonical/schema";
import { latestAffiliation } from "@/lib/cv/ogImage";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "@/lib/render/escape";

/**
 * Open Graph + Twitter Card meta tags for the public CV page. Social-preview
 * metadata only: profile type, the display name as title, and a short
 * description from the headline/summary. PURE + tested under the gate; the route
 * injects the returned string into the document <head>.
 *
 * Everything is run through `escapeHtml` (the document is user-controlled data)
 * so an attribute value can never break out of its quotes. No email or other
 * gated personal field is ever included — only already-public profile text.
 */

/** Max length of the og:description before we trim + ellipsis (keeps previews tidy). */
const DESCRIPTION_MAX = 200;
/**
 * Below this a search engine reports the description as "too short" (Bing's
 * floor is 25 characters) and writes its own snippet from the page body — for a
 * CV, usually the contact line. A headline like "PharmD" alone falls under it.
 */
const DESCRIPTION_MIN = 25;

/** Collapse whitespace and trim to a single clean line for a meta attribute. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** True if `code` is a UTF-16 high surrogate (the first unit of an astral pair). */
function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

/**
 * The social description: the headline, then the summary (truncated). When the
 * owner wrote neither — or only a few words — it falls back to a localized line
 * built from what the page already shows: the name, then the headline or the
 * latest visible affiliation (never a gated field). Three of the live public
 * pages had no description at all and two said only "PharmD" / "Curriculum
 * Vitae" (Bing audit, 2026-09-15).
 */
export function publicMetaDescription(cv: CanonicalCv): string {
  const parts = [cv.owner.headline, cv.owner.summary].map((p) => oneLine(p ?? "")).filter(Boolean);
  const joined = parts.join(" — ");
  if (joined.length < DESCRIPTION_MIN) return fallbackDescription(cv, joined);
  if (joined.length <= DESCRIPTION_MAX) return joined;
  // Trim at the limit and add an ellipsis (cut on a word boundary when possible).
  let cutLen = DESCRIPTION_MAX - 1;
  // Don't slice through a UTF-16 surrogate pair (CJK/emoji astral chars): if the
  // char just before the cut is a high surrogate, back off one so we never emit
  // a lone (broken) half-pair.
  if (isHighSurrogate(joined.charCodeAt(cutLen - 1))) cutLen -= 1;
  const cut = joined.slice(0, cutLen);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > DESCRIPTION_MAX / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

/**
 * "{who} — academic CV on SigmaCV, built from open research data" in the CV's
 * locale, where `who` is the display name followed by the short headline the
 * owner did write, else the latest visible position. A CV with no name and no
 * position still yields the localized tail, which is above the floor on its own.
 */
function fallbackDescription(cv: CanonicalCv, shortLead: string): string {
  const name = oneLine(cv.owner.displayName || "");
  const who = [name, shortLead || latestAffiliation(cv)].filter(Boolean).join(", ");
  const template = renderStrings(cv.display.locale).metaDescriptionFallback;
  // No `who` at all: drop the placeholder and the dash that would have followed it.
  return who ? template.replace("{who}", who) : template.replace(/^\{who\}\s*[—–-]+\s*/u, "");
}

/** One `<meta property="..." content="..."/>` tag (property = og:* namespace). */
function ogTag(property: string, content: string): string {
  return `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`;
}

/** One `<meta name="..." content="..."/>` tag (name = twitter:* / standard). */
function nameTag(name: string, content: string): string {
  return `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
}

/**
 * Build the SEO + OG/Twitter meta-tag block for a public CV.
 * - `pageUrl` (optional): emits `<link rel="canonical">` + `og:url` (consolidates
 *   the HTML page against its `.json`/`.bib`/… content-negotiated representations).
 * - `imageUrl` (optional): referenced as og:image.
 * The display name drives the title; a standard `<meta name="description">` (for the
 * SERP snippet) mirrors og:description, and both are omitted when there's no
 * headline/summary. The document `<title>` itself is set by the renderer.
 */
export function publicMetaTags(
  cv: CanonicalCv,
  opts: { imageUrl?: string; pageUrl?: string; feedUrl?: string } = {},
): string {
  const title = oneLine(cv.owner.displayName || "Curriculum Vitae");
  const description = publicMetaDescription(cv);
  const tags: string[] = [];
  if (opts.pageUrl) tags.push(`<link rel="canonical" href="${escapeHtml(opts.pageUrl)}" />`);
  // Atom feed discovery: a feed reader / browser surfaces the "Subscribe" affordance
  // from this alternate <link> (the public "follow my research" primitive).
  if (opts.feedUrl) {
    tags.push(
      `<link rel="alternate" type="application/atom+xml" title="${escapeHtml(
        title,
      )}" href="${escapeHtml(opts.feedUrl)}" />`,
    );
  }
  if (description) tags.push(nameTag("description", description));
  tags.push(ogTag("og:type", "profile"), ogTag("og:title", title));
  if (opts.pageUrl) tags.push(ogTag("og:url", opts.pageUrl));
  if (description) tags.push(ogTag("og:description", description));
  if (opts.imageUrl) tags.push(ogTag("og:image", opts.imageUrl));
  tags.push(nameTag("twitter:card", opts.imageUrl ? "summary_large_image" : "summary"));
  tags.push(nameTag("twitter:title", title));
  if (description) tags.push(nameTag("twitter:description", description));
  return tags.join("");
}
