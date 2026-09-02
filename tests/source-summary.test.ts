import { describe, expect, it } from "vitest";
import { displaySource, summarizeSources } from "@/lib/cv/sourceSummary";

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

  it("puts ORCID self-asserted patents in the identifier (auto-included) lane, EPO in review", () => {
    // #289: ORCID-asserted patents auto-include (own iD); EPO stays name-matched.
    const s = summarizeSources({ openalex: 3, "orcid.patents": 2, epo: 1 })!;
    expect(s.identifier.find((l) => l.label === "ORCID")?.count).toBe(2);
    expect(s.review.find((l) => l.label === "EPO")?.count).toBe(1);
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

describe("a source that spans both columns", () => {
  // Open Editors Plus is the first source to land in both groups: `oep` is
  // identifier-matched (the publisher printed the ORCID on the masthead) while
  // `oep.candidates` is a review tier (OEP inferred the identifier). Folding by
  // label alone summed them into one line under whichever group came first —
  // the panel read "Open Editors Plus 2" beside "added automatically" and never
  // mentioned that one of them needed a decision.
  it("keeps one line per group instead of summing them together", () => {
    const s = summarizeSources({ oep: 1, "oep.candidates": 1 })!;
    expect(s.identifier).toEqual([{ label: "Open Editors Plus", count: 1, group: "identifier" }]);
    // Review lines also carry the CvItem source they map to, so the panel's
    // chip can jump to the rows it counted.
    expect(s.review).toEqual([
      { label: "Open Editors Plus", count: 1, group: "review", itemSource: "oep" },
    ]);
    expect(s.total).toBe(2);
  });

  it("counts the source once as searched, however many columns it appears in", () => {
    expect(summarizeSources({ oep: 3, "oep.candidates": 5 })!.searched).toBe(1);
  });

  it("omits the empty side when only one tier returned anything", () => {
    const scrapedOnly = summarizeSources({ oep: 2, "oep.candidates": 0 })!;
    expect(scrapedOnly.identifier.map((l) => l.count)).toEqual([2]);
    expect(scrapedOnly.review).toEqual([]);

    const candidatesOnly = summarizeSources({ oep: 0, "oep.candidates": 4 })!;
    expect(candidatesOnly.identifier).toEqual([]);
    expect(candidatesOnly.review.map((l) => l.count)).toEqual([4]);
  });

  it("still folds keys that share a label AND a group", () => {
    // The behaviour the label-keyed fold existed for, unchanged.
    const s = summarizeSources({ "orcid.positions": 2, "orcid.fundings": 3, openalex: 1 })!;
    expect(s.identifier).toEqual([
      { label: "ORCID", count: 5, group: "identifier" },
      { label: "OpenAlex", count: 1, group: "identifier" },
    ]);
  });
});

describe("displaySource", () => {
  it("maps both the live timed-key and the sourceCounts-key to one display source", () => {
    // The build emits "openalex.works"; the persisted report folds it to "openalex".
    expect(displaySource("openalex.works")?.label).toBe("OpenAlex");
    expect(displaySource("openalex")?.label).toBe("OpenAlex");
    expect(displaySource("orcid.fundings")).toEqual({ label: "ORCID", group: "identifier" });
    expect(displaySource("nih")).toEqual({ label: "NIH", group: "review" });
  });

  it("returns null for prerequisites, owner-identity, and unknown keys", () => {
    expect(displaySource("openalex.resolveAuthor")).toBeNull();
    expect(displaySource("wikidata")).toBeNull();
    expect(displaySource("nope")).toBeNull();
  });
});
