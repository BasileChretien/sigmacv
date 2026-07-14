import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setPublicationName } from "@/lib/canonical/curate";
import { type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { withSelfPublicationName } from "@/lib/render/selfName";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "cv_name", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}
function selfCitation(cv: CanonicalCv): CvItem {
  const item = cv.sections
    .flatMap((s) => s.items)
    .find(
      (i) => i.authoredBySelf && i.csl && i.meta.authorPosition && (i.csl.author?.length ?? 0) > 0,
    );
  if (!item) throw new Error("fixture has no self-authored citation with a known position");
  return item;
}
function selfFamily(item: CvItem): string | undefined {
  return item.csl?.author?.[(item.meta.authorPosition ?? 0) - 1]?.family;
}

describe("withSelfPublicationName — substitute the self author before citeproc", () => {
  it("overrides the self author's family (by authorPosition) and augments highlight variants", () => {
    const item = selfCitation(makeCv());
    const pos = item.meta.authorPosition as number;
    const out = withSelfPublicationName(item, { family: "Nishikawa-Chrétien" });
    expect(out).not.toBe(item); // immutable — a new object
    expect(out.csl?.author?.[pos - 1]?.family).toBe("Nishikawa-Chrétien");
    expect(out.csl?.author?.length).toBe(item.csl?.author?.length); // co-authors untouched
    expect(out.selfNameVariants).toContain("Nishikawa-Chrétien"); // highlight can still match
    for (const v of item.selfNameVariants) expect(out.selfNameVariants).toContain(v); // superset
  });

  it("overrides the given name only when provided, else keeps the source given", () => {
    const item = selfCitation(makeCv());
    const pos = item.meta.authorPosition as number;
    const srcGiven = item.csl?.author?.[pos - 1]?.given;
    expect(withSelfPublicationName(item, { family: "X" }).csl?.author?.[pos - 1]?.given).toBe(
      srcGiven,
    );
    expect(
      withSelfPublicationName(item, { family: "X", given: "Y." }).csl?.author?.[pos - 1]?.given,
    ).toBe("Y.");
  });

  it("clears a source `literal` name so a family/given override actually prints", () => {
    const item = selfCitation(makeCv());
    const lit = {
      ...item,
      authoredBySelf: true,
      csl: { ...item.csl, author: [{ literal: "Chrétien Basile" }] },
      meta: { ...item.meta, authorPosition: 1 },
    } as CvItem;
    const out = withSelfPublicationName(lit, { family: "Nishikawa" });
    expect(out.csl?.author?.[0]?.literal).toBeUndefined();
    expect(out.csl?.author?.[0]?.family).toBe("Nishikawa");
  });

  it("is a no-op (same ref) for: no override, blank override, non-self, no CSL, unknown/out-of-range position, or a no-change override", () => {
    const item = selfCitation(makeCv());
    expect(withSelfPublicationName(item, undefined)).toBe(item);
    expect(withSelfPublicationName(item, { family: "  ", given: "" })).toBe(item);
    const notSelf = { ...item, authoredBySelf: false };
    expect(withSelfPublicationName(notSelf, { family: "X" })).toBe(notSelf);
    const noCsl = { ...item, csl: undefined } as CvItem;
    expect(withSelfPublicationName(noCsl, { family: "X" })).toBe(noCsl);
    const noPos = { ...item, meta: { ...item.meta, authorPosition: undefined } };
    expect(withSelfPublicationName(noPos, { family: "X" })).toBe(noPos);
    const badPos = { ...item, meta: { ...item.meta, authorPosition: 999 } };
    expect(withSelfPublicationName(badPos, { family: "X" })).toBe(badPos);
    const src = selfFamily(item);
    if (src) expect(withSelfPublicationName(item, { family: src })).toBe(item);
  });
});

describe("setPublicationName (curate)", () => {
  it("stores parts, drops blank parts, clears when both empty, caps to 200 chars, is immutable", () => {
    const cv = makeCv();
    const set = setPublicationName(cv, { family: "Nishikawa-Pacher", given: "   " });
    expect(set.owner.publicationName).toEqual({ family: "Nishikawa-Pacher", given: undefined });
    expect(cv).not.toBe(set);
    expect(
      setPublicationName(set, { family: "", given: "" }).owner.publicationName,
    ).toBeUndefined();
    expect(
      setPublicationName(cv, { family: "z".repeat(250) }).owner.publicationName?.family?.length,
    ).toBe(200);
  });
});

describe.skipIf(!hasApa)(
  "preferred publication name flows through citeproc into every format",
  () => {
    it("renders the renamed self author in the Markdown citation, still self-highlighted", () => {
      const cv = setPublicationName(makeCv(), { family: "Nishikawa-Chrétien" });
      const md = renderCvMarkdown(cv);
      expect(md).toContain("Nishikawa-Chrétien"); // substitution reached the rendered citation
      expect(md).toMatch(/\*\*[^*]*Nishikawa-Chrétien/); // and it's inside a self-highlight bold span
    });
  },
);
