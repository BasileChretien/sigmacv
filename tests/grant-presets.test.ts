import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import {
  CV_MODELS,
  GRANT_PRESETS,
  GRANT_PRESET_IDS,
  applyCvModel,
  applyGrantPreset,
  isGrantPresetId,
} from "@/lib/canonical/cvModels";

/**
 * Back-compat layer: the original four grant presets (erc / msca / nsf / jsps)
 * are re-exposed from the CV-model catalog in their legacy shape so the grant-CV
 * Markdown renderer + its i18n captions keep working unchanged. These tests pin
 * that bridge; the full catalog + `applyCvModel` are tested in cv-models.test.ts.
 */

/** A minimal section of the given type with one included item. */
function section(type: CvSectionType): CvSection {
  return {
    id: type,
    type,
    title: type,
    visible: true,
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

describe("grant-preset back-compat", () => {
  it("exposes exactly ERC + MSCA + NSF + JSPS", () => {
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
    // msca-pf is the catalog id, NOT a legacy grant-preset id.
    expect(isGrantPresetId("msca-pf")).toBe(false);
  });

  it("each legacy preset maps to its catalog model's sections + display", () => {
    const expectMaps = (presetId: keyof typeof GRANT_PRESETS, modelId: string) => {
      const model = CV_MODELS.find((m) => m.id === modelId)!;
      expect(GRANT_PRESETS[presetId].visibleSections).toEqual(model.sections);
      expect(GRANT_PRESETS[presetId].display.publicationsLimit).toBe(
        model.display?.publicationsLimit,
      );
      // The legacy shape defaults the optional model fields (year-desc / true) so
      // the four funders keep their selected, peer-reviewed, newest-first record.
      expect(GRANT_PRESETS[presetId].display.publicationOrder).toBe(
        model.display?.publicationOrder ?? "year-desc",
      );
      expect(GRANT_PRESETS[presetId].display.peerReviewedOnly).toBe(
        model.display?.peerReviewedOnly ?? true,
      );
    };
    // `msca` legacy id ↔ the `msca-pf` catalog model.
    expectMaps("erc", "erc");
    expectMaps("msca", "msca-pf");
    expectMaps("nsf", "nsf");
    expectMaps("jsps", "jsps");
  });

  it("applyGrantPreset is a no-op for an unknown id", () => {
    const cv = makeCv();
    expect(applyGrantPreset(cv, "unknown")).toBe(cv);
    // msca-pf is a catalog id, not a legacy grant-preset id → no-op here.
    expect(applyGrantPreset(cv, "msca-pf")).toBe(cv);
  });

  it("applyGrantPreset delegates to applyCvModel (msca → msca-pf)", () => {
    const cv = makeCv();
    expect(applyGrantPreset(cv, "erc")).toEqual(applyCvModel(cv, "erc"));
    expect(applyGrantPreset(cv, "msca")).toEqual(applyCvModel(cv, "msca-pf"));
    expect(applyGrantPreset(cv, "nsf")).toEqual(applyCvModel(cv, "nsf"));
    expect(applyGrantPreset(cv, "jsps")).toEqual(applyCvModel(cv, "jsps"));
  });

  it("applyGrantPreset never mutates the input document", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    applyGrantPreset(cv, "erc");
    applyGrantPreset(cv, "msca");
    expect(JSON.stringify(cv)).toBe(snapshot);
  });
});
