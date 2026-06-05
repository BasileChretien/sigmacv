import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import type { CslItem } from "@/types/csl";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * CSL-JSON export of the curated citations — the language-neutral interchange
 * format read by Zotero, citeproc, pandoc, and most reference managers. It is
 * the exact `item.csl` payload citeproc renders, so it always matches the CV.
 * Includes every shown, owned reference (has CSL, included, not "not mine")
 * across all visible sections — the same predicate every other renderer uses.
 *
 * The public page already serves this for PUBLISHED CVs; this is the
 * authenticated owner's download path for the same data.
 */
export function cvCslItems(cv: CanonicalCv): CslItem[] {
  return visibleSections(cv)
    .flatMap((s) => visibleItems(s))
    .filter((i): i is CvItem & { csl: CslItem } => Boolean(i.csl) && !i.notMine)
    .map((i) => i.csl);
}

export function renderCvCslJson(cv: CanonicalCv): string {
  return `${JSON.stringify(cvCslItems(cv), null, 2)}\n`;
}

export const csljsonRenderer: Renderer = {
  format: "csljson",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "csljson",
      mimeType: "application/vnd.citationstyles.csl+json",
      filename: `${cvSlug(cv.owner.displayName)}-cv.csl.json`,
      text: renderCvCslJson(cv),
    };
  },
};
