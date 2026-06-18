import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { stripInlineMarkup } from "@/lib/text/markup";

/**
 * Atom feed of a published living CV's research outputs — the public "follow my
 * research" primitive (`/p/[slug]/feed.xml`). Built from an already-PUBLIC-PROJECTED
 * CV (so hidden / "not mine" / contact-gated data is already gone). Pure: it takes
 * the projected CV, slug, and site origin and returns Atom XML. No `Date.now()` —
 * the feed's `updated` is the CV's last-sync timestamp, so the same CV yields the
 * same feed (cache-friendly, reproducible).
 */

const FEED_MAX = 40;
const SUMMARY_MAX = 500;

/** Citation sections whose works make sense as feed entries. */
const FEED_SECTIONS = new Set(["publications", "preprints", "datasets", "conference"]);

/** XML-escape a text value for an Atom element or attribute. */
function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A clean https DOI URL from a possibly-prefixed DOI, or undefined. */
function doiUrl(item: CvItem): string | undefined {
  const doi = item.meta.doi ?? item.csl?.DOI;
  if (!doi) return undefined;
  return `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
}

/** Best landing link for an entry: DOI → the work's URL → the CV page. */
function entryLink(item: CvItem, pageUrl: string): string {
  return doiUrl(item) ?? item.csl?.URL ?? pageUrl;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** RFC3339 timestamp for an entry from its issued date-parts (the precision we
 *  store), falling back to the feed-level timestamp when the work has no date. */
function entryUpdated(item: CvItem, fallback: string): string {
  const dp = item.csl?.issued?.["date-parts"]?.[0];
  if (dp && typeof dp[0] === "number") {
    const m = typeof dp[1] === "number" ? dp[1] : 1;
    const d = typeof dp[2] === "number" ? dp[2] : 1;
    return `${dp[0]}-${pad2(m)}-${pad2(d)}T00:00:00Z`;
  }
  if (typeof item.meta.year === "number") return `${item.meta.year}-01-01T00:00:00Z`;
  return fallback;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

/** Render the public living CV's Atom feed. `baseUrl` is the site origin. */
export function renderCvAtomFeed(cv: CanonicalCv, slug: string, baseUrl: string): string {
  const origin = baseUrl.replace(/\/+$/, "");
  const pageUrl = `${origin}/p/${slug}`;
  const feedUrl = `${pageUrl}/feed.xml`;
  const name = cv.owner.displayName || "SigmaCV";
  // Reproducible feed-level timestamp (no wall-clock): the CV's last sync.
  const updated = cv.provenance.lastSyncedAt || cv.provenance.generatedAt;

  const works = visibleSections(cv)
    .filter((s) => FEED_SECTIONS.has(s.type))
    .flatMap((s) => visibleItems(s))
    .filter((it) => Boolean(it.csl) && !it.notMine);
  const ordered = [...works]
    .sort((a, b) => (b.meta.year ?? 0) - (a.meta.year ?? 0))
    .slice(0, FEED_MAX);

  const entries = ordered
    .map((item) => {
      const title = xml(stripInlineMarkup(item.csl?.title ?? "Untitled"));
      const link = entryLink(item, pageUrl);
      const id = doiUrl(item) ?? `urn:sigmacv:${slug}:${item.id}`;
      const when = entryUpdated(item, updated);
      const abstract = item.csl?.abstract?.trim();
      const summary = abstract
        ? `\n    <summary>${xml(truncate(stripInlineMarkup(abstract), SUMMARY_MAX))}</summary>`
        : "";
      return `  <entry>
    <title>${title}</title>
    <id>${xml(id)}</id>
    <updated>${xml(when)}</updated>
    <link rel="alternate" href="${xml(link)}"/>${summary}
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xml(name)}</title>
  <subtitle>Research outputs</subtitle>
  <id>${xml(pageUrl)}</id>
  <updated>${xml(updated)}</updated>
  <link rel="self" type="application/atom+xml" href="${xml(feedUrl)}"/>
  <link rel="alternate" type="text/html" href="${xml(pageUrl)}"/>
  <author><name>${xml(name)}</name></author>
  <generator>SigmaCV</generator>
${entries}
</feed>
`;
}
