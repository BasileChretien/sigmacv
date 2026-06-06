import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  NARRATIVE_MODULE_KEYS,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import {
  GRANT_PRESETS,
  GRANT_PRESET_IDS,
  applyGrantPreset,
  isGrantPresetId,
} from "@/lib/canonical/grantPresets";
import { updateDisplay, upsertNarrativeModule } from "@/lib/canonical/curate";

/** A minimal section of the given type with one included item. */
function section(type: CvSectionType, visible = true): CvSection {
  return {
    id: type,
    type,
    title: type,
    visible,
    order: 0,
    items: [
      {
        id: `${type}:1`,
        source: "manual",
        sourceId: "manual",
        displayText: `${type} item`,
        included: true,
        notMine: false,
        order: 0,
        authoredBySelf: false,
        selfNameVariants: [],
        meta: {},
      },
    ],
  };
}

/**
 * A CV with a broad spread of section types: some the presets want visible,
 * some they don't (skills/languages/references/datasets/preprints), so we can
 * prove both the show and the hide behaviour. Parsed through the schema so the
 * fixture is always a valid CanonicalCv.
 */
function makeCv(): CanonicalCv {
  const types: CvSectionType[] = [
    "positions",
    "education",
    "publications",
    "preprints",
    "datasets",
    "grants",
    "awards",
    "talks",
    "teaching",
    "supervision",
    "editorial",
    "peer-review",
    "service",
    "skills",
    "languages",
    "references",
  ];
  return CanonicalCvSchema.parse({
    schemaVersion: 1,
    id: "grant_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale: "en-US" },
    sections: types.map((t, i) => ({ ...section(t), order: i })),
    presets: [],
    narrative: [],
    provenance: { generatedAt: "2026-06-02T00:00:00.000Z", sources: ["manual"] },
  });
}

const visibleTypes = (cv: CanonicalCv): Set<string> =>
  new Set(cv.sections.filter((s) => s.visible).map((s) => s.type));

describe("grant preset catalog", () => {
  it("exposes exactly ERC + MSCA, and the catalog covers them", () => {
    expect([...GRANT_PRESET_IDS]).toEqual(["erc", "msca"]);
    for (const id of GRANT_PRESET_IDS) {
      expect(GRANT_PRESETS[id]).toBeTruthy();
      expect(GRANT_PRESETS[id].visibleSections.length).toBeGreaterThan(0);
    }
  });

  it("isGrantPresetId guards known vs unknown ids", () => {
    expect(isGrantPresetId("erc")).toBe(true);
    expect(isGrantPresetId("msca")).toBe(true);
    expect(isGrantPresetId("nope")).toBe(false);
  });

  it("ERC: ~10 selected, peer-reviewed, newest-first, with narrative", () => {
    const c = GRANT_PRESETS.erc;
    expect(c.display.publicationsLimit).toBe(10);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    expect(c.includesNarrative).toBe(true);
    expect(c.visibleSections).toContain("publications");
    expect(c.visibleSections).toContain("grants");
  });

  it("MSCA: tighter selected list, peer-reviewed, newest-first, with narrative", () => {
    const c = GRANT_PRESETS.msca;
    expect(c.display.publicationsLimit).toBe(8);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    expect(c.includesNarrative).toBe(true);
    expect(c.visibleSections).toContain("education");
    expect(c.visibleSections).toContain("publications");
  });
});

describe("applyGrantPreset", () => {
  it("is a no-op (identity) for an unknown id", () => {
    const cv = makeCv();
    expect(applyGrantPreset(cv, "unknown")).toBe(cv);
  });

  it("never mutates the input document", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    applyGrantPreset(cv, "erc");
    applyGrantPreset(cv, "msca");
    expect(JSON.stringify(cv)).toBe(snapshot);
  });

  it("returns a new object reference", () => {
    const cv = makeCv();
    expect(applyGrantPreset(cv, "erc")).not.toBe(cv);
  });

  for (const id of GRANT_PRESET_IDS) {
    it(`${id}: sets exactly the catalog's section visibility`, () => {
      const next = applyGrantPreset(makeCv(), id);
      const want = new Set(GRANT_PRESETS[id].visibleSections);
      const got = visibleTypes(next);
      // Every wanted section that exists is visible…
      for (const type of want) expect(got.has(type)).toBe(true);
      // …and nothing outside the rubric is left visible.
      for (const type of got) expect(want.has(type as CvSectionType)).toBe(true);
      // Sections not in the rubric (skills/languages/references/…) are hidden.
      expect(got.has("skills")).toBe(false);
      expect(got.has("languages")).toBe(false);
      expect(got.has("preprints")).toBe(false);
    });

    it(`${id}: applies the catalog display fields`, () => {
      const next = applyGrantPreset(makeCv(), id);
      const c = GRANT_PRESETS[id];
      expect(next.display.publicationsLimit).toBe(c.display.publicationsLimit);
      expect(next.display.publicationOrder).toBe(c.display.publicationOrder);
      expect(next.display.peerReviewedOnly).toBe(c.display.peerReviewedOnly);
    });

    it(`${id}: seeds the six narrative modules (empty bodies, included)`, () => {
      const next = applyGrantPreset(makeCv(), id);
      expect(next.narrative.map((m) => m.key).sort()).toEqual(
        [...NARRATIVE_MODULE_KEYS].sort(),
      );
      for (const m of next.narrative) {
        expect(m.body).toBe("");
        expect(m.included).toBe(true);
        expect(m.heading.length).toBeGreaterThan(0);
      }
    });

    it(`${id}: leaves curated item data intact (visibility/display only)`, () => {
      const cv = makeCv();
      const next = applyGrantPreset(cv, id);
      // Same sections, same items, same item content — only `visible` changes.
      expect(next.sections.map((s) => s.type)).toEqual(
        cv.sections.map((s) => s.type),
      );
      for (const s of next.sections) {
        const before = cv.sections.find((b) => b.id === s.id)!;
        expect(s.items).toEqual(before.items);
      }
    });

    it(`${id}: is deterministic`, () => {
      const a = applyGrantPreset(makeCv(), id);
      const b = applyGrantPreset(makeCv(), id);
      expect(a).toEqual(b);
    });
  }

  it("preserves narrative modules the user already wrote (no overwrite)", () => {
    let cv = makeCv();
    cv = upsertNarrativeModule(cv, "knowledge", { body: "My real contributions." });
    const next = applyGrantPreset(cv, "erc");
    const knowledge = next.narrative.find((m) => m.key === "knowledge")!;
    expect(knowledge.body).toBe("My real contributions.");
    // The other five are seeded around it.
    expect(next.narrative).toHaveLength(NARRATIVE_MODULE_KEYS.length);
  });

  it("does not duplicate narrative modules when all six are already present", () => {
    // Pre-seed every module, then apply: seedNarrative finds no additions and
    // returns the document untouched (no growth, bodies preserved).
    let cv = makeCv();
    for (const key of NARRATIVE_MODULE_KEYS) {
      cv = upsertNarrativeModule(cv, key, { body: `body for ${key}` });
    }
    const next = applyGrantPreset(cv, "msca");
    expect(next.narrative).toHaveLength(NARRATIVE_MODULE_KEYS.length);
    expect(next.narrative).toEqual(cv.narrative);
  });

  it("seeds the narrative in the requested locale", () => {
    const next = applyGrantPreset(makeCv(), "erc", "fr-FR");
    const ps = next.narrative.find((m) => m.key === "personal-statement")!;
    expect(ps.heading).toBe("Présentation personnelle");
  });

  it("defaults the seed locale to the CV's own display locale", () => {
    const cv = updateDisplay(makeCv(), { locale: "de-DE" });
    const next = applyGrantPreset(cv, "msca");
    const ps = next.narrative.find((m) => m.key === "personal-statement")!;
    expect(ps.heading).toBe("Persönliche Darstellung");
  });
});
