import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  PROSE_SECTION_TYPES,
  isProseSectionType,
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
import { setSectionBody, updateDisplay } from "@/lib/canonical/curate";

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
    schemaVersion: 2,
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
    provenance: { generatedAt: "2026-06-02T00:00:00.000Z", sources: ["manual"] },
  });
}

const visibleTypes = (cv: CanonicalCv): Set<string> =>
  new Set(cv.sections.filter((s) => s.visible).map((s) => s.type));

describe("grant preset catalog", () => {
  it("exposes exactly ERC + MSCA + NSF + JSPS, and the catalog covers them", () => {
    expect([...GRANT_PRESET_IDS]).toEqual(["erc", "msca", "nsf", "jsps"]);
    for (const id of GRANT_PRESET_IDS) {
      expect(GRANT_PRESETS[id]).toBeTruthy();
      expect(GRANT_PRESETS[id].visibleSections.length).toBeGreaterThan(0);
    }
  });

  it("isGrantPresetId guards known vs unknown ids", () => {
    expect(isGrantPresetId("erc")).toBe(true);
    expect(isGrantPresetId("msca")).toBe(true);
    expect(isGrantPresetId("nsf")).toBe(true);
    expect(isGrantPresetId("jsps")).toBe(true);
    expect(isGrantPresetId("nope")).toBe(false);
  });

  it("every preset lists the four narrative contribution prose sections", () => {
    for (const id of GRANT_PRESET_IDS) {
      const proseInPreset = GRANT_PRESETS[id].visibleSections.filter((t) =>
        isProseSectionType(t),
      );
      expect(proseInPreset).toContain("narrative-knowledge");
      expect(proseInPreset).toContain("narrative-individuals");
      expect(proseInPreset).toContain("narrative-community");
      expect(proseInPreset).toContain("narrative-society");
    }
  });

  it("ERC: ~10 selected, peer-reviewed, newest-first, with narrative + grants", () => {
    const c = GRANT_PRESETS.erc;
    expect(c.display.publicationsLimit).toBe(10);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    expect(c.visibleSections).toContain("publications");
    expect(c.visibleSections).toContain("grants");
    expect(c.visibleSections).toContain("narrative-knowledge");
  });

  it("MSCA: tighter selected list, peer-reviewed, newest-first, with narrative", () => {
    const c = GRANT_PRESETS.msca;
    expect(c.display.publicationsLimit).toBe(8);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    expect(c.visibleSections).toContain("education");
    expect(c.visibleSections).toContain("publications");
    expect(c.visibleSections).toContain("narrative-society");
  });

  it("NSF: SciENcv blocks (prep/appointments/products/synergistic+funding), ~10, narrative", () => {
    const c = GRANT_PRESETS.nsf;
    expect(c.display.publicationsLimit).toBe(10);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    // Professional Preparation / Appointments / Products / Synergistic / funding.
    expect(c.visibleSections).toContain("education");
    expect(c.visibleSections).toContain("positions");
    expect(c.visibleSections).toContain("publications");
    expect(c.visibleSections).toContain("service");
    expect(c.visibleSections).toContain("talks");
    expect(c.visibleSections).toContain("grants");
    expect(c.visibleSections).toContain("narrative-community");
  });

  it("JSPS: researchmap/e-Rad blocks (achievements/career/funding/awards), narrative", () => {
    const c = GRANT_PRESETS.jsps;
    expect(c.display.publicationsLimit).toBe(10);
    expect(c.display.publicationOrder).toBe("year-desc");
    expect(c.display.peerReviewedOnly).toBe(true);
    // Research achievements / career (positions + education) / funding / awards.
    expect(c.visibleSections).toContain("publications");
    expect(c.visibleSections).toContain("positions");
    expect(c.visibleSections).toContain("education");
    expect(c.visibleSections).toContain("grants");
    expect(c.visibleSections).toContain("awards");
    expect(c.visibleSections).toContain("narrative-individuals");
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
      // Every wanted section is visible…
      for (const type of want) expect(got.has(type)).toBe(true);
      // …and nothing outside the rubric is left visible.
      for (const type of got) expect(want.has(type as CvSectionType)).toBe(true);
      // Sections not in the rubric (skills/languages/references/…) are hidden.
      expect(got.has("skills")).toBe(false);
      expect(got.has("languages")).toBe(false);
      expect(got.has("preprints")).toBe(false);
    });

    it(`${id}: creates the narrative contribution prose sections (empty body)`, () => {
      const next = applyGrantPreset(makeCv(), id);
      for (const type of GRANT_PRESETS[id].visibleSections) {
        if (!isProseSectionType(type)) continue;
        const sec = next.sections.find((s) => s.type === type)!;
        expect(sec).toBeTruthy();
        expect(sec.visible).toBe(true);
        expect(sec.items).toEqual([]);
        expect(sec.body).toBe("");
      }
      // Every preset materializes all four narrative contribution sections.
      const proseTypes = next.sections
        .filter((s) => isProseSectionType(s.type))
        .map((s) => s.type);
      expect(proseTypes).toEqual(
        expect.arrayContaining([
          "narrative-knowledge",
          "narrative-individuals",
          "narrative-community",
          "narrative-society",
        ]),
      );
    });

    it(`${id}: orders the visible sections in the preset's sequence`, () => {
      const next = applyGrantPreset(makeCv(), id);
      const seq = GRANT_PRESETS[id].visibleSections;
      const visibleOrdered = [...next.sections]
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order)
        .map((s) => s.type);
      expect(visibleOrdered).toEqual([...seq]);
      // The hidden sections all sort AFTER the visible block.
      const maxVisibleOrder = Math.max(
        ...next.sections.filter((s) => s.visible).map((s) => s.order),
      );
      for (const s of next.sections.filter((s) => !s.visible)) {
        expect(s.order).toBeGreaterThan(maxVisibleOrder);
      }
    });

    it(`${id}: applies the catalog display fields`, () => {
      const next = applyGrantPreset(makeCv(), id);
      const c = GRANT_PRESETS[id];
      expect(next.display.publicationsLimit).toBe(c.display.publicationsLimit);
      expect(next.display.publicationOrder).toBe(c.display.publicationOrder);
      expect(next.display.peerReviewedOnly).toBe(c.display.peerReviewedOnly);
      expect(next.display.sectionsCustomized).toBe(true);
    });

    it(`${id}: leaves curated item data intact (visibility/order/display only)`, () => {
      const cv = makeCv();
      const next = applyGrantPreset(cv, id);
      // Every original section still present with the same items (order/visible
      // may change; the curated item content does not).
      for (const before of cv.sections) {
        const after = next.sections.find((s) => s.id === before.id)!;
        expect(after).toBeTruthy();
        expect(after.items).toEqual(before.items);
      }
    });

    it(`${id}: is deterministic`, () => {
      const a = applyGrantPreset(makeCv(), id);
      const b = applyGrantPreset(makeCv(), id);
      expect(a).toEqual(b);
    });
  }

  it("preserves a narrative contribution body the user already wrote", () => {
    let cv = makeCv();
    // Materialize a narrative-knowledge section and write into it.
    cv = applyGrantPreset(cv, "erc");
    const sec = cv.sections.find((s) => s.type === "narrative-knowledge")!;
    cv = setSectionBody(cv, sec.id, "My real contributions.");
    // Re-applying the preset must not clobber the written body.
    const next = applyGrantPreset(cv, "erc");
    const knowledge = next.sections.find((s) => s.type === "narrative-knowledge")!;
    expect(knowledge.body).toBe("My real contributions.");
  });

  it("does not duplicate narrative sections when applied twice", () => {
    let cv = applyGrantPreset(makeCv(), "msca");
    cv = applyGrantPreset(cv, "msca");
    for (const type of PROSE_SECTION_TYPES) {
      const matches = cv.sections.filter((s) => s.type === type);
      // statement is never auto-created by a preset; the four narrative-* exist once.
      expect(matches.length).toBeLessThanOrEqual(1);
    }
  });

  it("seeds the narrative section titles in the CV's display locale", () => {
    const cv = updateDisplay(makeCv(), { locale: "fr-FR" });
    const next = applyGrantPreset(cv, "erc");
    const knowledge = next.sections.find((s) => s.type === "narrative-knowledge")!;
    expect(knowledge.title).toBe("Contributions à la production de connaissances");
  });
});
