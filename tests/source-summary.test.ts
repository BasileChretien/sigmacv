import { describe, expect, it } from "vitest";
import { summarizeSources } from "@/lib/cv/sourceSummary";

describe("summarizeSources", () => {
  it("returns null when there is nothing to show", () => {
    expect(summarizeSources(undefined)).toBeNull();
    expect(summarizeSources({})).toBeNull();
    // Every source failed soft (all zero) → nothing worth surfacing.
    expect(summarizeSources({ openalex: 0, nih: 0 })).toBeNull();
  });

  it("folds orcid.* and crossref.grants into one display source each", () => {
    const s = summarizeSources({
      "orcid.positions": 3,
      "orcid.fundings": 2,
      "orcid.discovery": 1,
      "crossref.grants": 4,
    });
    expect(s).not.toBeNull();
    const orcid = s!.identifier.find((l) => l.label === "ORCID");
    expect(orcid?.count).toBe(6);
    expect(s!.identifier.find((l) => l.label === "Crossref")?.count).toBe(4);
  });

  it("splits identifier-matched from name-matched (review) sources", () => {
    const s = summarizeSources({
      openalex: 87,
      "orcid.positions": 5,
      datacite: 1,
      nih: 4,
      clinicaltrials: 2,
    })!;
    expect(s.identifier.map((l) => l.label)).toEqual(["OpenAlex", "ORCID", "DataCite"]);
    expect(s.review.map((l) => l.label)).toEqual(["NIH", "ClinicalTrials.gov"]);
    expect(s.total).toBe(99);
  });

  it("counts queried sources even when they returned nothing, but omits zero lines", () => {
    const s = summarizeSources({ openalex: 5, epo: 0, ukri: 0 })!;
    // Queried 3 distinct sources; only the non-empty one is listed.
    expect(s.searched).toBe(3);
    expect(s.review).toHaveLength(0);
    expect(s.identifier).toEqual([{ label: "OpenAlex", count: 5, group: "identifier" }]);
  });

  it("sorts by count desc, then label; ignores unknown keys and bad counts", () => {
    const s = summarizeSources({
      dblp: 2,
      datacite: 2,
      openaire: 9,
      future_source: 100,
      openalex: Number.NaN,
    })!;
    // openaire first (9); DataCite before DBLP on the count tie (alphabetical).
    expect(s.identifier.map((l) => l.label)).toEqual(["OpenAIRE", "DataCite", "DBLP"]);
    // Unknown key excluded from totals and from the searched count.
    expect(s.total).toBe(13);
    expect(s.searched).toBe(4); // openaire, dblp, datacite, openalex (NaN→queried, 0 items)
  });
});
