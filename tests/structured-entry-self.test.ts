import { describe, expect, it } from "vitest";
import { addStructuredEntry, manualSelfNameVariants } from "@/lib/canonical/curate";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";

function makeCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      { id: "publications", type: "publications", title: "P", visible: true, order: 0, items: [] },
    ],
    provenance: { generatedAt: "2026-06-11T00:00:00.000Z", sources: ["openalex"] },
  });
}

const FIELDS = {
  title: "A hand-entered paper",
  authors: "Chrétien, Basile; Doe, Jane",
  year: 2024,
};

describe("addStructuredEntry — “this is my work”", () => {
  it("stays unattributed by default (no self-highlight)", () => {
    const cv = addStructuredEntry(makeCv(), "publications", FIELDS, "pub:manual:1");
    const item = cv.sections[0]!.items[0]!;
    expect(item.authoredBySelf).toBe(false);
    expect(item.selfNameVariants).toEqual([]);
    expect(item.meta.matchBasis).toBeUndefined();
  });

  it("marks the entry user-claimed when the self author is named", () => {
    const cv = addStructuredEntry(makeCv(), "publications", FIELDS, "pub:manual:1", {
      selfAuthorName: "Chrétien, Basile",
    });
    const item = cv.sections[0]!.items[0]!;
    expect(item.authoredBySelf).toBe(true);
    // User-ASSERTED ownership — same basis as claim-by-DOI, never a name match.
    expect(item.meta.matchBasis).toBe("claimed");
    // The family name is the reliably-present token across citation styles.
    expect(item.selfNameVariants).toContain("Chrétien");
    expect(item.selfNameVariants).toContain("Chrétien, Basile");
    expect(item.selfNameVariants).toContain("Basile Chrétien");
  });

  it("treats a blank self author as absent", () => {
    const cv = addStructuredEntry(makeCv(), "publications", FIELDS, "pub:manual:1", {
      selfAuthorName: "   ",
    });
    const item = cv.sections[0]!.items[0]!;
    expect(item.authoredBySelf).toBe(false);
    expect(item.selfNameVariants).toEqual([]);
  });
});

describe("manualSelfNameVariants", () => {
  it("derives family-first and given-first variants from either input order", () => {
    expect(manualSelfNameVariants("Chrétien, Basile")).toEqual(
      expect.arrayContaining(["Chrétien, Basile", "Basile Chrétien", "Chrétien"]),
    );
    expect(manualSelfNameVariants("Basile Chrétien")).toEqual(
      expect.arrayContaining(["Basile Chrétien", "Chrétien, Basile", "Chrétien"]),
    );
  });

  it("keeps a CJK name verbatim (no order flip)", () => {
    expect(manualSelfNameVariants("田中太郎")).toEqual(["田中太郎"]);
  });

  it("handles family-only and blank input", () => {
    expect(manualSelfNameVariants("Chrétien")).toEqual(["Chrétien"]);
    expect(manualSelfNameVariants("  ")).toEqual([]);
    // Single letters are dropped (too short to highlight safely).
    expect(manualSelfNameVariants("X")).toEqual([]);
  });
});
