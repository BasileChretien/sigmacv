import { describe, expect, it } from "vitest";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  migrateCanonicalDocument,
  parseCanonicalCv,
  safeParseCanonicalCv,
} from "@/lib/canonical/schema";

describe("migrateCanonicalDocument", () => {
  it("passes a current (v2) document through unchanged", () => {
    const doc = { schemaVersion: CANONICAL_SCHEMA_VERSION, id: "x" };
    expect(migrateCanonicalDocument(doc)).toBe(doc);
  });
  it("returns non-object inputs unchanged", () => {
    expect(migrateCanonicalDocument(null)).toBeNull();
    expect(migrateCanonicalDocument("nope")).toBe("nope");
  });
  it("upgrades a v1 document to the current version (and drops the narrative field)", () => {
    const doc = { id: "x", schemaVersion: 1, narrative: [] };
    const out = migrateCanonicalDocument(doc) as Record<string, unknown>;
    expect(out.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
    expect(out.narrative).toBeUndefined();
  });
  it("tolerates a missing schemaVersion (treated as v1 → upgraded)", () => {
    const doc = { id: "x" };
    const out = migrateCanonicalDocument(doc) as Record<string, unknown>;
    expect(out.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
  });

  it("does not mutate the caller's object (incl. nested owner) when upgrading", () => {
    const doc = {
      id: "x",
      schemaVersion: 1,
      owner: { summary: "" },
      narrative: [{ key: "personal-statement", heading: "Bio", body: "My bio." }],
    };
    const snapshot = JSON.stringify(doc);
    const out = migrateCanonicalDocument(doc) as Record<string, unknown>;
    // The caller's object (and its nested owner) is untouched…
    expect(JSON.stringify(doc)).toBe(snapshot);
    expect(out).not.toBe(doc);
    // …while the returned copy carries the migration (summary folded in).
    expect((out.owner as { summary?: string }).summary).toBe("My bio.");
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
      publicStyle: "match",
      cslStyle: "apa",
      locale: "en-US",
      highlightSelf: true,
      highlightStyle: "accent",
      cvLicense: "none",
      showMetrics: false,
      metrics: [],
      showCharts: false,
      showOpenAccess: false,
      hideRetracted: false,
      showAuthorRole: false,
      showCitationCounts: false,
      showProvenance: false,
      peerReviewedOnly: false,
      countLetters: true,
      publicationOrder: "custom",
      sectionsCustomized: false,
      showAuthorshipTable: false,
      authorshipRoles: [],
      accentColor: "#1f4fd8",
      fontPairing: "serif",
      density: "comfortable",
      publicContact: { email: false, phone: false, location: false },
      publicAttribution: true,
      showCoauthorLinks: false,
      coauthorLinkable: true,
    });
  });

  it("accepts a valid 6-digit hex accent and rejects bad ones", () => {
    expect(DisplayChoicesSchema.safeParse({ accentColor: "#0f766e" }).success).toBe(true);
    expect(DisplayChoicesSchema.safeParse({ accentColor: "red" }).success).toBe(false);
    expect(DisplayChoicesSchema.safeParse({ accentColor: "#fff" }).success).toBe(false);
    // Guards against CSS injection via the colour value.
    expect(DisplayChoicesSchema.safeParse({ accentColor: "#000; } body{x" }).success).toBe(false);
  });

  it("rejects unknown font / density values", () => {
    expect(DisplayChoicesSchema.safeParse({ fontPairing: "comic" }).success).toBe(false);
    expect(DisplayChoicesSchema.safeParse({ density: "huge" }).success).toBe(false);
  });

  it("constrains locale to a BCP-47 shape and falls back on an injection-shaped value", () => {
    expect(DisplayChoicesSchema.parse({ locale: "fr-FR" }).locale).toBe("fr-FR");
    // A value carrying markup is neutralized to the default, never stored verbatim.
    expect(DisplayChoicesSchema.parse({ locale: 'en-US"><script>' }).locale).toBe("en-US");
    expect(DisplayChoicesSchema.parse({ locale: "x".repeat(80) }).locale).toBe("en-US");
  });

  it("defaults cvLicense to none and accepts known licenses / rejects unknown", () => {
    expect(DisplayChoicesSchema.parse({}).cvLicense).toBe("none");
    expect(DisplayChoicesSchema.safeParse({ cvLicense: "CC-BY-4.0" }).success).toBe(true);
    expect(DisplayChoicesSchema.safeParse({ cvLicense: "all-rights-reserved" }).success).toBe(true);
    expect(DisplayChoicesSchema.safeParse({ cvLicense: "WTFPL" }).success).toBe(false);
  });

  it("coerces an unknown/removed template to classic (forward-compat fallback)", () => {
    // A CV saved with a since-removed template (minimal/compact/editorial) must
    // still load — .catch falls the field back to classic instead of failing.
    const parsed = DisplayChoicesSchema.safeParse({ template: "minimal" });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.template).toBe("classic");
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

  it("degrades an unknown meta.reviewFlag to undefined instead of failing the read", () => {
    const withBogusFlag = {
      ...validCv,
      sections: [
        {
          ...validCv.sections[0],
          items: [
            {
              id: "W1",
              source: "openalex",
              sourceId: "https://openalex.org/W1",
              included: true,
              order: 0,
              authoredBySelf: false,
              selfNameVariants: [],
              meta: { reviewFlag: "some-future-or-crafted-flag" },
            },
          ],
        },
      ],
    };
    const parsed = safeParseCanonicalCv(withBogusFlag);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.sections[0]!.items[0]!.meta.reviewFlag).toBeUndefined();
  });

  it("round-trips meta.duplicateOf + display.dismissedDuplicates and degrades a bogus tier", () => {
    const withDup = {
      ...validCv,
      display: { ...validCv.display, dismissedDuplicates: ["10.1/a|10.1/b"] },
      sections: [
        {
          ...validCv.sections[0],
          items: [
            {
              id: "W2",
              source: "openalex",
              sourceId: "https://openalex.org/W2",
              included: true,
              order: 0,
              authoredBySelf: false,
              selfNameVariants: [],
              meta: {
                reviewFlag: "duplicate",
                duplicateOf: {
                  itemId: "W1",
                  tier: "some-future-tier",
                  relationship: "bogus-rel",
                  groupId: "W1",
                },
              },
            },
          ],
        },
      ],
    };
    const parsed = safeParseCanonicalCv(withDup);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.display.dismissedDuplicates).toEqual(["10.1/a|10.1/b"]);
    const dup = parsed.data.sections[0]!.items[0]!.meta.duplicateOf!;
    expect(dup.itemId).toBe("W1");
    expect(dup.tier).toBe("weak"); // unknown tier degrades via .catch
    expect(dup.relationship).toBeUndefined(); // unknown relationship degrades
  });

  it("rejects an oversized item id (field-length cap, defence against payload abuse)", () => {
    const bad = {
      ...validCv,
      sections: [
        {
          ...validCv.sections[0],
          items: [
            {
              id: "W1".padEnd(2000, "x"), // > the 1024-char id cap
              source: "openalex",
              sourceId: "https://openalex.org/W1",
              included: true,
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

  it("rejects an oversized section title and owner displayName", () => {
    const longTitle = {
      ...validCv,
      sections: [{ ...validCv.sections[0], title: "T".repeat(2000) }],
    };
    expect(safeParseCanonicalCv(longTitle).success).toBe(false);
    const longName = { ...validCv, owner: { ...validCv.owner, displayName: "N".repeat(2000) } };
    expect(safeParseCanonicalCv(longName).success).toBe(false);
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
