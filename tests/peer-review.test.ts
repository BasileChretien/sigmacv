import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { prepareSections } from "@/lib/render/prepare";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const hasApa = listAvailableStyles().includes("apa");
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, over: Partial<OpenAlexWork>): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: id,
    display_name: id,
    type: "article",
    publication_year: 2024,
    authorships: [{ author: { id: "https://openalex.org/A5001069481" } }],
    primary_location: { source: { display_name: "J. Pharmacology", type: "journal" } },
    ...over,
  } as OpenAlexWork;
}

describe("isPeerReviewed (via build meta.peerReviewed)", () => {
  function build(works: OpenAlexWork[]) {
    return buildCanonicalCv({ id: "pr", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  }
  const flag = (cv: ReturnType<typeof build>, srcId: string) =>
    cv.sections.flatMap((s) => s.items).find((i) => i.sourceId === srcId)!.meta.peerReviewed;

  it("marks a journal article as peer-reviewed", () => {
    const cv = build([work("Wart", {})]);
    expect(flag(cv, "https://openalex.org/Wart")).toBe(true);
  });

  it("marks a type=preprint work as not peer-reviewed", () => {
    const cv = build([
      work("Wpre", { type: "preprint", primary_location: { source: { display_name: "bioRxiv", type: "repository" } } }),
    ]);
    expect(flag(cv, "https://openalex.org/Wpre")).toBe(false);
  });

  it("marks a posted-content work (preprint leaking into Publications) as not peer-reviewed", () => {
    const cv = build([
      work("Wposted", { type: "posted-content", primary_location: { source: { display_name: "Research Square", type: "repository" } } }),
    ]);
    expect(flag(cv, "https://openalex.org/Wposted")).toBe(false);
  });

  it("marks a dataset and a venue-less work as not peer-reviewed", () => {
    const cv = build([
      work("Wdata", { type: "dataset" }),
      work("Wnovenue", { primary_location: { source: undefined } }),
    ]);
    expect(flag(cv, "https://openalex.org/Wdata")).toBe(false);
    expect(flag(cv, "https://openalex.org/Wnovenue")).toBe(false);
  });
});

describe.skipIf(!hasApa)("peerReviewedOnly render filter (prepareSections)", () => {
  // A peer-reviewed article + a preprint that (hypothetically) sits in the same
  // section, plus a non-citation grant entry.
  const article = work("Wjournal", { title: "Peer-reviewed paper" });
  const preprint = work("Wprep", {
    title: "A preprint",
    type: "preprint",
    primary_location: { source: { display_name: "medRxiv", type: "repository" } },
  });

  function cvWith() {
    return buildCanonicalCv({
      id: "f",
      resolved,
      works: [article, preprint],
      now: "2026-06-02T00:00:00.000Z",
      fundings: [{ putCode: "1", title: "ANR grant", organization: "ANR" }],
    });
  }

  it("keeps everything when the filter is off", () => {
    const prepared = prepareSections(cvWith(), "text");
    const titles = prepared.flatMap((s) => s.items).map((i) => i.item.csl?.title ?? i.item.displayText);
    expect(titles).toContain("Peer-reviewed paper");
    expect(titles).toContain("A preprint");
    expect(titles.some((t) => t?.includes("ANR grant"))).toBe(true);
  });

  it("drops non-peer-reviewed citations but keeps non-citation entries when on", () => {
    const cv = updateDisplay(cvWith(), { peerReviewedOnly: true });
    const prepared = prepareSections(cv, "text");
    const items = prepared.flatMap((s) => s.items).map((i) => i.item);
    // The preprint citation is gone…
    expect(items.some((i) => i.csl?.title === "A preprint")).toBe(false);
    // …the peer-reviewed article stays…
    expect(items.some((i) => i.csl?.title === "Peer-reviewed paper")).toBe(true);
    // …and the grant (non-citation) is untouched.
    expect(items.some((i) => (i.displayText ?? "").includes("ANR grant"))).toBe(true);
  });
});

describe.skipIf(!hasApa)("publicationOrder render sort", () => {
  // Three articles: low/high/mid citations, ascending years.
  const works = [
    work("Wa", { title: "Older few-cited", publication_year: 2018, cited_by_count: 3 }),
    work("Wb", { title: "Newer highly-cited", publication_year: 2022, cited_by_count: 120 }),
    work("Wc", { title: "Mid", publication_year: 2020, cited_by_count: 40 }),
  ];
  const base = () =>
    buildCanonicalCv({ id: "ord", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  const pubTitles = (cv: ReturnType<typeof base>) =>
    prepareSections(cv, "text")
      .find((s) => s.section.type === "publications")!
      .items.map((i) => i.item.csl?.title);

  it("custom (default) keeps the built newest-first order", () => {
    expect(pubTitles(base())).toEqual(["Newer highly-cited", "Mid", "Older few-cited"]);
  });

  it("citations sorts most-cited first", () => {
    const cv = updateDisplay(base(), { publicationOrder: "citations" });
    expect(pubTitles(cv)).toEqual(["Newer highly-cited", "Mid", "Older few-cited"]);
  });

  it("year-asc sorts oldest first", () => {
    const cv = updateDisplay(base(), { publicationOrder: "year-asc" });
    expect(pubTitles(cv)).toEqual(["Older few-cited", "Mid", "Newer highly-cited"]);
  });
});
