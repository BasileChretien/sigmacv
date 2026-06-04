import { describe, expect, it } from "vitest";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  migrateCanonicalDocument,
  parseCanonicalCv,
  safeParseCanonicalCv,
} from "@/lib/canonical/schema";

describe("migrateCanonicalDocument", () => {
  it("passes a current (v1) document through unchanged", () => {
    const doc = { schemaVersion: 1, id: "x" };
    expect(migrateCanonicalDocument(doc)).toBe(doc);
  });
  it("returns non-object inputs unchanged", () => {
    expect(migrateCanonicalDocument(null)).toBeNull();
    expect(migrateCanonicalDocument("nope")).toBe("nope");
  });
  it("tolerates a missing schemaVersion (defaults to 1)", () => {
    const doc = { id: "x" };
    expect(migrateCanonicalDocument(doc)).toBe(doc);
  });
});

const validCv = {
  schemaVersion: CANONICAL_SCHEMA_VERSION,
  id: "cv_1",
  owner: {
    orcid: "0000-0002-7483-2489",
    openAlexAuthorIds: ["A5001069481"],
    displayName: "Basile Chrétien",
  },
  display: {
    template: "classic",
    cslStyle: "apa",
    locale: "en-US",
    highlightSelf: true,
    showMetrics: false,
  },
  sections: [
    {
      id: "publications",
      type: "publications",
      title: "Publications",
      visible: true,
      order: 0,
      items: [],
    },
  ],
  provenance: { generatedAt: "2026-06-02T00:00:00.000Z", sources: ["openalex"] },
};

describe("DisplayChoicesSchema", () => {
  it("applies sane defaults (metrics off, highlight on, APA, classic/serif)", () => {
    const d = DisplayChoicesSchema.parse({});
    expect(d).toEqual({
      template: "classic",
      cslStyle: "apa",
      locale: "en-US",
      highlightSelf: true,
      highlightStyle: "accent",
      showMetrics: false,
      metrics: [],
      showCharts: false,
      showOpenAccess: true,
      showAuthorRole: false,
      showCitationCounts: false,
      showProvenance: true,
      peerReviewedOnly: false,
      publicationOrder: "custom",
      sectionsCustomized: false,
      showAuthorshipTable: false,
      authorshipRoles: [],
      accentColor: "#1f4fd8",
      fontPairing: "serif",
      density: "comfortable",
    });
  });

  it("accepts a valid 6-digit hex accent and rejects bad ones", () => {
    expect(DisplayChoicesSchema.safeParse({ accentColor: "#0f766e" }).success).toBe(true);
    expect(DisplayChoicesSchema.safeParse({ accentColor: "red" }).success).toBe(false);
    expect(DisplayChoicesSchema.safeParse({ accentColor: "#fff" }).success).toBe(false);
    // Guards against CSS injection via the colour value.
    expect(
      DisplayChoicesSchema.safeParse({ accentColor: "#000; } body{x" }).success,
    ).toBe(false);
  });

  it("rejects unknown template / font / density values", () => {
    expect(DisplayChoicesSchema.safeParse({ template: "fancy" }).success).toBe(false);
    expect(DisplayChoicesSchema.safeParse({ fontPairing: "comic" }).success).toBe(false);
    expect(DisplayChoicesSchema.safeParse({ density: "huge" }).success).toBe(false);
  });
});

describe("parseCanonicalCv", () => {
  it("accepts a well-formed document", () => {
    expect(() => parseCanonicalCv(validCv)).not.toThrow();
  });

  it("rejects an unknown schema version", () => {
    const bad = { ...validCv, schemaVersion: 999 };
    expect(safeParseCanonicalCv(bad).success).toBe(false);
  });

  it("rejects an unknown section type", () => {
    const bad = {
      ...validCv,
      sections: [{ ...validCv.sections[0], type: "nonsense" }],
    };
    expect(safeParseCanonicalCv(bad).success).toBe(false);
  });

  it("is backward compatible: an item without notMine parses to notMine=false", () => {
    const legacy = {
      ...validCv,
      sections: [
        {
          ...validCv.sections[0],
          items: [
            {
              id: "W1",
              source: "openalex",
              sourceId: "https://openalex.org/W1",
              csl: { id: "W1", type: "article-journal" },
              included: false,
              order: 0,
              authoredBySelf: true,
              selfNameVariants: [],
              meta: {},
              // note: no notMine / notMineAssertedAt (a pre-existing document)
            },
          ],
        },
      ],
    };
    const parsed = parseCanonicalCv(legacy);
    const item = parsed.sections[0]!.items[0]!;
    expect(item.notMine).toBe(false); // old included:false is a hide, not an assertion
    expect(item.notMineAssertedAt).toBeUndefined();
  });

  it("rejects a non-boolean included flag on an item", () => {
    const bad = {
      ...validCv,
      sections: [
        {
          ...validCv.sections[0],
          items: [
            {
              id: "W1",
              source: "openalex",
              sourceId: "https://openalex.org/W1",
              csl: { id: "W1", type: "article-journal" },
              included: "yes",
              order: 0,
              authoredBySelf: false,
              selfNameVariants: [],
              meta: {},
            },
          ],
        },
      ],
    };
    expect(safeParseCanonicalCv(bad).success).toBe(false);
  });
});
