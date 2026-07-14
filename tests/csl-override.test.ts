import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemVenue, setItemYear } from "@/lib/canonical/curate";
import {
  itemEffectiveYear,
  itemVenue,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { cslForRender } from "@/lib/render/cslOverride";
import { renderCvMarkdown } from "@/lib/render/markdown";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const SECTION = "publications";
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "cv_bib", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}
function firstCitation(cv: CanonicalCv): CvItem {
  const sec = cv.sections.find((s) => s.type === "publications");
  const item = sec?.items.find((i) => i.csl);
  if (!item) throw new Error("fixture has no citation item");
  return item;
}
function journalCitation(cv: CanonicalCv): CvItem {
  const sec = cv.sections.find((s) => s.type === "publications");
  const item = sec?.items.find((i) => typeof i.csl?.["container-title"] === "string");
  if (!item) throw new Error("fixture has no journal citation");
  return item;
}

describe("cslForRender — bibliographic overrides patched before citeproc", () => {
  it("returns the CSL unchanged (same ref) when there are no overrides", () => {
    const item = firstCitation(makeCv());
    expect(cslForRender(item)).toBe(item.csl);
  });

  it("returns undefined for a non-citation item (no CSL)", () => {
    expect(cslForRender({ csl: undefined, meta: {} as CvItem["meta"] })).toBeUndefined();
  });

  it("patches the year override into csl.issued as a year-only date, keeping the id", () => {
    const item = firstCitation(makeCv());
    const patched = cslForRender({ ...item, meta: { ...item.meta, yearOverride: 1999 } });
    expect(patched?.issued).toEqual({ "date-parts": [[1999]] });
    expect(patched?.id).toBe(item.csl?.id); // id preserved so the id→entry map still keys
  });

  it("patches the venue override into container-title", () => {
    const item = firstCitation(makeCv());
    const patched = cslForRender({ ...item, meta: { ...item.meta, venueOverride: "PNAS" } });
    expect(patched?.["container-title"]).toBe("PNAS");
  });

  it("treats an empty-string venue override as no override", () => {
    const item = firstCitation(makeCv());
    expect(cslForRender({ ...item, meta: { ...item.meta, venueOverride: "" } })).toBe(item.csl);
  });
});

describe("itemEffectiveYear / itemVenue helpers", () => {
  it("prefer the override, else the source, else undefined", () => {
    const item = firstCitation(makeCv());
    expect(itemEffectiveYear({ meta: { ...item.meta, yearOverride: 2001 } })).toBe(2001);
    expect(itemEffectiveYear(item)).toBe(item.meta.year);
    const j = journalCitation(makeCv());
    expect(itemVenue({ csl: j.csl, meta: { ...j.meta, venueOverride: "Abbr." } })).toBe("Abbr.");
    expect(itemVenue(j)).toBe(j.csl?.["container-title"]);
    expect(itemVenue({ csl: undefined, meta: {} as CvItem["meta"] })).toBeUndefined();
  });
});

describe("setItemYear / setItemVenue — pure, immutable, revert-on-source", () => {
  it("stores a year override and clears it on null or a value equal to source", () => {
    const cv = makeCv();
    const item = firstCitation(cv);
    const withY = setItemYear(cv, SECTION, item.id, 1999);
    expect(firstCitation(withY).meta.yearOverride).toBe(1999);
    expect(cv).not.toBe(withY); // immutable
    // Out-of-range / non-integer years are rejected up front (schema bounds 1–3000),
    // returning the CV untouched rather than storing a value that would break the save.
    expect(setItemYear(withY, SECTION, item.id, 99999)).toBe(withY);
    expect(setItemYear(withY, SECTION, item.id, 0)).toBe(withY);
    expect(setItemYear(withY, SECTION, item.id, 1990.5)).toBe(withY);
    expect(
      firstCitation(setItemYear(withY, SECTION, item.id, null)).meta.yearOverride,
    ).toBeUndefined();
    const src = item.meta.year;
    if (src !== undefined) {
      expect(
        firstCitation(setItemYear(cv, SECTION, item.id, src)).meta.yearOverride,
      ).toBeUndefined();
    }
  });

  it("stores a venue override and clears it on blank or a value equal to source", () => {
    const cv = makeCv();
    const item = journalCitation(cv);
    const withV = setItemVenue(cv, SECTION, item.id, "J. Test Abbrev.");
    const stored = withV.sections.flatMap((s) => s.items).find((i) => i.id === item.id);
    expect(stored?.meta.venueOverride).toBe("J. Test Abbrev.");
    const blanked = setItemVenue(withV, SECTION, item.id, "   ");
    expect(
      blanked.sections.flatMap((s) => s.items).find((i) => i.id === item.id)?.meta.venueOverride,
    ).toBeUndefined();
    const source = item.csl?.["container-title"] as string;
    const same = setItemVenue(cv, SECTION, item.id, source);
    expect(
      same.sections.flatMap((s) => s.items).find((i) => i.id === item.id)?.meta.venueOverride,
    ).toBeUndefined();
  });

  it("is a no-op for an unknown item id", () => {
    const cv = makeCv();
    expect(setItemYear(cv, SECTION, "nope", 2000)).toEqual(cv);
    expect(setItemVenue(cv, SECTION, "nope", "x")).toEqual(cv);
  });

  it("rejects an over-long venue (schema caps at 500 chars) untouched", () => {
    const cv = makeCv();
    const item = journalCitation(cv);
    expect(setItemVenue(cv, SECTION, item.id, "x".repeat(501))).toBe(cv);
    // Exactly at the cap is accepted.
    const at = setItemVenue(cv, SECTION, item.id, "y".repeat(500));
    expect(
      at.sections.flatMap((s) => s.items).find((i) => i.id === item.id)?.meta.venueOverride,
    ).toBe("y".repeat(500));
  });
});

describe.skipIf(!hasApa)("overrides flow through citeproc into every format", () => {
  it("renders the overridden year and journal in the Markdown citation", () => {
    let cv = makeCv();
    const item = journalCitation(cv);
    cv = setItemYear(cv, SECTION, item.id, 1999);
    cv = setItemVenue(cv, SECTION, item.id, "J. Test Abbrev.");
    const md = renderCvMarkdown(cv);
    expect(md).toContain("1999"); // the overridden year, via citeproc
    expect(md).toContain("J. Test Abbrev."); // the overridden journal, via citeproc
  });
});
