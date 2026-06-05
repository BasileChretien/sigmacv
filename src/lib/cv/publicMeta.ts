import type { CanonicalCv } from "@/lib/canonical/schema";
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

/** Collapse whitespace and trim to a single clean line for a meta attribute. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * The social description: the headline, then the summary (truncated). Returns ""
 * when neither is set, so the caller can omit the og:description tag entirely.
 */
export function publicMetaDescription(cv: CanonicalCv): string {
  const parts = [cv.owner.headline, cv.owner.summary]
    .map((p) => oneLine(p ?? ""))
    .filter(Boolean);
  const joined = parts.join(" — ");
  if (joined.length <= DESCRIPTION_MAX) return joined;
  // Trim at the limit and add an ellipsis (cut on a word boundary when possible).
  const cut = joined.slice(0, DESCRIPTION_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > DESCRIPTION_MAX / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
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
 * Build the OG/Twitter meta-tag block for a public CV. `imageUrl` (optional) is
 * referenced as og:image when supplied. The display name drives og:title; the
 * description tag is omitted when there's no headline/summary.
 */
export function publicMetaTags(cv: CanonicalCv, opts: { imageUrl?: string } = {}): string {
  const title = oneLine(cv.owner.displayName || "Curriculum Vitae");
  const description = publicMetaDescription(cv);
  const tags: string[] = [
    ogTag("og:type", "profile"),
    ogTag("og:title", title),
  ];
  if (description) tags.push(ogTag("og:description", description));
  if (opts.imageUrl) tags.push(ogTag("og:image", opts.imageUrl));
  tags.push(nameTag("twitter:card", opts.imageUrl ? "summary_large_image" : "summary"));
  tags.push(nameTag("twitter:title", title));
  if (description) tags.push(nameTag("twitter:description", description));
  return tags.join("");
}
