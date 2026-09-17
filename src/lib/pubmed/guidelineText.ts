import type { CvItem } from "@/lib/canonical/schema";

/** One stored guideline citing a work (`meta.guidelineCitations[n]`). */
export type GuidelineCitation = NonNullable<CvItem["meta"]["guidelineCitations"]>[number];

/** The PubMed record page of a citing guideline. */
export function pubmedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid.trim())}/`;
}

/**
 * How a citing guideline reads in a line of text: "Title (J Clin Oncol, 2021)",
 * the parenthesis holding whatever of journal and year is known. Client-safe
 * (no network, no server import) so the editor row and the starter draft share it.
 */
export function guidelineCitationLine(g: GuidelineCitation): string {
  const title = g.title.trim().replace(/\.$/, "");
  const tail = [g.source?.trim(), g.year !== undefined ? String(g.year) : ""]
    .filter(Boolean)
    .join(", ");
  return tail ? `${title} (${tail})` : title;
}
