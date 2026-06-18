import type { CanonicalCv } from "@/lib/canonical/schema";
import { cslItemsToBibtex } from "@/lib/render/bibtex";
import { cslItemsToRis } from "@/lib/render/ris";
import type { CslItem } from "@/types/csl";

/**
 * Single-work citation export for the public page's per-publication "Cite"
 * affordance (`/p/[slug]/cite`). Given an already-PUBLIC-PROJECTED CV, find ONE
 * citation item by id and serialize just that work to BibTeX / RIS / CSL-JSON —
 * reusing the same canonical CSL the whole-CV exports use, so a single citation
 * always matches the bibliography. Pure (no IO).
 *
 * The CV is the public projection, so a hidden / "not mine" / per-view-excluded
 * work is already absent → `citeItem` returns null and the route 404s. This means
 * the affordance can only ever cite a work that is actually on the public page.
 */

export const CITE_FORMATS = ["bibtex", "ris", "csljson"] as const;
export type CiteFormat = (typeof CITE_FORMATS)[number];

/** Narrow an arbitrary query value to a supported cite format. */
export function isCiteFormat(value: string): value is CiteFormat {
  return (CITE_FORMATS as readonly string[]).includes(value);
}

const FORMAT_META: Record<CiteFormat, { contentType: string; extension: string }> = {
  bibtex: { contentType: "application/x-bibtex; charset=utf-8", extension: "bib" },
  ris: { contentType: "application/x-research-info-systems; charset=utf-8", extension: "ris" },
  csljson: {
    contentType: "application/vnd.citationstyles.csl+json; charset=utf-8",
    extension: "csl.json",
  },
};

export interface CitedItem {
  contentType: string;
  /** Filename extension (no leading dot), e.g. "bib" / "ris" / "csl.json". */
  extension: string;
  body: string;
}

/** The CSL for a public, citation item with the given id, or undefined. */
function findCsl(cv: CanonicalCv, itemId: string): CslItem | undefined {
  for (const section of cv.sections) {
    const found = section.items.find((it) => it.id === itemId && it.csl);
    if (found?.csl) return found.csl;
  }
  return undefined;
}

/**
 * Serialize a single work (by item id) to one citation format, or null when no
 * public citation item carries that id.
 */
export function citeItem(cv: CanonicalCv, itemId: string, format: CiteFormat): CitedItem | null {
  const csl = findCsl(cv, itemId);
  if (!csl) return null;
  const meta = FORMAT_META[format];
  const body =
    format === "bibtex"
      ? cslItemsToBibtex([csl])
      : format === "ris"
        ? cslItemsToRis([csl])
        : JSON.stringify(csl, null, 2);
  return { contentType: meta.contentType, extension: meta.extension, body };
}
