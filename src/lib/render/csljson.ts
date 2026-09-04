import type { CanonicalCv } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";
import { citationCslItems } from "./citationItems";
import { cvSlug } from "./slug";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * The CSL items the citation exports serialise — shared by the authenticated
 * CSL-JSON export here, the public CSL-JSON/BibTeX exports (`cv/publicFormats.ts`
 * re-exports this) and the RO-Crate bundle. Exactly the references the rendered
 * CV lists (`citationItems.ts`: visible, owned, per-view exclusions and "hide
 * retracted" applied), each carrying the owner's year / venue / publication-name
 * corrections — the same CSL citeproc renders, so the exports always match the
 * CV and the public + owner surfaces can never diverge.
 */
export function cvCslItems(cv: CanonicalCv): CslItem[] {
  return citationCslItems(cv);
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
