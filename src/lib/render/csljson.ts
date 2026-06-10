import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import type { CslItem } from "@/types/csl";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * The SINGLE definition of the "shown, owned, citation" predicate, shared by the
 * authenticated CSL-JSON export here and the public CSL-JSON/BibTeX exports
 * (`cv/publicFormats.ts` re-exports this). Includes every reference that is
 * visible (section + item shown), owned (not "not mine"), and carries a CSL
 * payload — the exact `item.csl` citeproc renders, so it always matches the CV.
 * Keeping it in one place means the public + owner surfaces can never diverge.
 */
export function cvCslItems(cv: CanonicalCv): CslItem[] {
  // When the owner opts to hide retracted works, exclude them from the citation
  // exports too (so the CSL-JSON / BibTeX lists match the rendered CV).
  const hideRetracted = cv.display.hideRetracted === true;
  return visibleSections(cv)
    .flatMap((s) => visibleItems(s))
    .filter(
      (i): i is CvItem & { csl: CslItem } =>
        Boolean(i.csl) && !i.notMine && !(hideRetracted && i.meta.retracted),
    )
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
      mimeType: "application/vnd.citationstyles.csl+json; charset=utf-8",
      filename: `${cvSlug(cv.owner.displayName)}-cv.csl.json`,
      text: renderCvCslJson(cv),
    };
  },
};
