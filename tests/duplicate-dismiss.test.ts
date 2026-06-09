import { describe, expect, it } from "vitest";
import { dismissDuplicate } from "@/lib/canonical/curate";
import { annotateDuplicates, duplicatePairKey } from "@/lib/canonical/duplicates";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";

const DISPLAY = DisplayChoicesSchema.parse({});

function cite(id: string, doi: string, peerReviewed: boolean): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    csl: { id, type: "article-journal", title: "Same Work", DOI: doi },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: { doi, year: 2024, peerReviewed },
  };
}

function dupCv(): CanonicalCv {
  return annotateDuplicates({
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: "cv",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "T",
      links: [],
      countsByYear: [],
    },
    display: DISPLAY,
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [cite("W1", "10.1/x", true), cite("W2", "10.1/x", false)],
      },
    ],
    presets: [],
    provenance: { generatedAt: "2026-01-01T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe("dismissDuplicate", () => {
  it("records the pair key, clears the hint, and survives re-detection", () => {
    const cv = dupCv();
    const [w1, w2] = cv.sections[0]!.items;
    expect(w2!.meta.reviewFlag).toBe("duplicate"); // pre-condition

    const out = dismissDuplicate(cv, "publications", "W2");
    const key = duplicatePairKey(w1!, w2!);
    expect(out.display.dismissedDuplicates).toEqual([key]);
    const clearedW2 = out.sections[0]!.items[1]!;
    expect(clearedW2.meta.reviewFlag).toBeUndefined();
    expect(clearedW2.meta.duplicateOf).toBeUndefined();

    // A re-sync re-runs detection — the dismissed pair must NOT be re-flagged.
    const reannotated = annotateDuplicates(out);
    expect(reannotated.sections[0]!.items[1]!.meta.reviewFlag).toBeUndefined();
  });

  it("does not duplicate an already-recorded dismissal key", () => {
    const once = dismissDuplicate(dupCv(), "publications", "W2");
    const twice = dismissDuplicate(once, "publications", "W2");
    expect(twice.display.dismissedDuplicates).toEqual(once.display.dismissedDuplicates);
  });

  it("is a no-op for an item with no duplicate hint", () => {
    const cv = dupCv();
    expect(dismissDuplicate(cv, "publications", "W1")).toBe(cv); // W1 is the representative
    expect(dismissDuplicate(cv, "publications", "missing")).toBe(cv);
    expect(dismissDuplicate(cv, "missing", "W2")).toBe(cv);
  });
});
