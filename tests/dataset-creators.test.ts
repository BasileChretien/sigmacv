import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import type { DataciteOutput } from "@/lib/datacite/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { CanonicalCv } from "@/lib/canonical/schema";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function buildDs(creators: { name: string; orcid?: string }[]): CanonicalCv {
  return buildCanonicalCv({
    id: "cv",
    resolved,
    works: [],
    dataciteOutputs: [
      {
        doi: "10.5281/zenodo.20594123",
        title: "SigmaCV",
        type: "Software",
        year: 2026,
        publisher: "Zenodo",
        creators,
      },
    ] as unknown as DataciteOutput[],
    now: "2026-06-02T00:00:00.000Z",
  });
}
const dsItem = (cv: CanonicalCv) => cv.sections.find((s) => s.type === "datasets")!.items[0]!;

describe("DataCite dataset entries show + highlight their creators", () => {
  it("includes the (abbreviated) creators in the entry text", () => {
    const it = dsItem(
      buildDs([
        { name: "Chrétien, Basile", orcid: "0000-0002-7483-2489" },
        { name: "Dolladille, Charles" },
      ]),
    );
    expect(it.displayText).toContain("Chrétien, B.");
    expect(it.displayText).toContain("Dolladille, C.");
    expect(it.displayText).toContain("SigmaCV"); // title still present
    expect(it.displayText).toContain("[Software]");
    expect(it.displayText).not.toContain("B.."); // no doubled period before the title
  });

  it("fills selfNameVariants from the creator's own spelling when the owner ORCID matches", () => {
    // The accent-free spelling DataCite stored ("Chretien") — using the CREATOR
    // name (not the owner profile "Chrétien") guarantees it matches the entry text.
    const it = dsItem(buildDs([{ name: "Chretien, Basile", orcid: "0000-0002-7483-2489" }]));
    expect(it.selfNameVariants).toContain("Chretien");
  });

  it("leaves selfNameVariants empty when the owner is not a creator", () => {
    const it = dsItem(buildDs([{ name: "Other, Alice", orcid: "0000-0000-0000-0001" }]));
    expect(it.selfNameVariants).toEqual([]);
  });

  it.skipIf(!hasApa)("highlights the owner's name in the rendered dataset entry", () => {
    const cv = buildDs([
      { name: "Chrétien, Basile", orcid: "0000-0002-7483-2489" },
      { name: "Other, Alice" },
    ]);
    const html = renderCvHtml(cv);
    expect(html).toContain('<span class="cv-self">Chrétien</span>');
    expect(html).not.toContain('<span class="cv-self">Other</span>'); // co-author untouched
  });
});
