import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemFeatured } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { prepareSections } from "@/lib/render/prepare";
import { buildRenderedSections } from "@/lib/render/html";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [
      { author: { id: SELF, display_name: "Basile Chrétien" }, raw_author_name: "Basile Chrétien" },
    ],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

const WORKS = [work("W1", 2024), work("W2", 2023), work("W3", 2022), work("W4", 2021)];
function makeCv(previous?: CanonicalCv): CanonicalCv {
  return buildCanonicalCv({
    id: "feat",
    resolved,
    works: WORKS,
    now: "2026-06-02T00:00:00.000Z",
    previous,
  });
}

function pubItem(cv: CanonicalCv, id: string) {
  return cv.sections.find((s) => s.type === "publications")?.items.find((i) => i.id === id);
}

describe("setItemFeatured", () => {
  it("pins and unpins a publication immutably", () => {
    const cv = makeCv();
    expect(pubItem(cv, "W3")?.featured).toBeFalsy();

    const pinned = setItemFeatured(cv, "publications", "W3", true);
    expect(pinned).not.toBe(cv);
    expect(pubItem(pinned, "W3")?.featured).toBe(true);
    // The original CV is unchanged (pure / immutable op).
    expect(pubItem(cv, "W3")?.featured).toBeFalsy();

    const unpinned = setItemFeatured(pinned, "publications", "W3", false);
    expect(pubItem(unpinned, "W3")?.featured).toBe(false);
  });

  it("is a no-op for an unknown section", () => {
    const cv = makeCv();
    expect(setItemFeatured(cv, "no-such-section", "W1", true)).toEqual(cv);
  });
});

describe("featured survives re-sync", () => {
  it("carries the pin across a rebuild (like included)", () => {
    const pinned = setItemFeatured(makeCv(), "publications", "W2", true);
    const resynced = makeCv(pinned);
    expect(pubItem(resynced, "W2")?.featured).toBe(true);
    expect(pubItem(resynced, "W1")?.featured).toBeFalsy();
  });
});

describe.skipIf(!hasApa)("featured ordering + Selected badge", () => {
  it("pins a featured work to the top of its section, ahead of the normal order", () => {
    const cv = setItemFeatured(makeCv(), "publications", "W3", true);
    const items = prepareSections(cv, "text").find((s) => s.section.type === "publications")!.items;
    // W3 (2022) leads despite W1/W2 being newer.
    expect(items[0]!.item.id).toBe("W3");
  });

  it("never reorders when every work is featured (stable)", () => {
    let cv = makeCv();
    for (const id of ["W1", "W2", "W3", "W4"]) cv = setItemFeatured(cv, "publications", id, true);
    const ids = prepareSections(cv, "text")
      .find((s) => s.section.type === "publications")!
      .items.map((i) => i.item.id);
    expect(ids).toEqual(["W1", "W2", "W3", "W4"]);
  });

  it("marks a featured work with the Selected star badge in HTML", () => {
    const cv = setItemFeatured(makeCv(), "publications", "W3", true);
    const sec = buildRenderedSections(cv).find((s) => s.section.type === "publications")!;
    expect(sec.items.find((i) => i.item.id === "W3")!.html).toContain("cv-badge-featured");
    expect(sec.items.find((i) => i.item.id === "W1")!.html).not.toContain("cv-badge-featured");
  });
});
