import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  SECTION_TYPES,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import {
  CV_MODELS,
  CV_MODEL_CATEGORY_ORDER,
  applyCvModel,
  cvModelList,
  cvModelsByCategory,
  isCvModelId,
  type CvModelCategory,
} from "@/lib/canonical/cvModels";
import { setSectionBody, applyPreset, savePreset } from "@/lib/canonical/curate";

const SECTION_TYPE_SET = new Set<string>(SECTION_TYPES);

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

/**
 * A CV carrying every NON-PROSE section type, so applying any model proves both
 * the show behaviour (its sections, incl. created prose) and the hide behaviour
 * (everything outside the model). Parsed through the schema so the fixture is
 * always a valid CanonicalCv.
 */
function makeCv(locale = "en-US"): CanonicalCv {
  const types = SECTION_TYPES.filter((t) => !isProseSectionType(t));
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cvmodel_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale },
    sections: types.map((t, i) => ({ ...section(t), order: i })),
    presets: [],
    provenance: { generatedAt: "2026-06-02T00:00:00.000Z", sources: ["manual"] },
  });
}

const visibleTypes = (cv: CanonicalCv): Set<string> =>
  new Set(cv.sections.filter((s) => s.visible).map((s) => s.type));

const visibleOrderedTypes = (cv: CanonicalCv): CvSectionType[] =>
  [...cv.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.type);

describe("CV-model catalog", () => {
  it("has at least one model in each of the three categories", () => {
    const cats = new Set(CV_MODELS.map((m) => m.category));
    expect(cats).toEqual(new Set<CvModelCategory>(["grant", "institution", "industry"]));
  });

  it("counts: grant + institution + industry models", () => {
    const byCat = (c: CvModelCategory) =>
      CV_MODELS.filter((m) => m.category === c).length;
    expect(byCat("grant")).toBe(21);
    expect(byCat("institution")).toBe(7);
    expect(byCat("industry")).toBe(4);
    expect(CV_MODELS.length).toBe(32);
  });

  it("every model has a unique id", () => {
    const ids = CV_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every model has a non-empty name, description, region and sections", () => {
    for (const m of CV_MODELS) {
      expect(m.name.length, `${m.id} name`).toBeGreaterThan(0);
      expect(m.description.length, `${m.id} description`).toBeGreaterThan(0);
      expect(m.region.length, `${m.id} region`).toBeGreaterThan(0);
      expect(m.sections.length, `${m.id} sections`).toBeGreaterThan(0);
    }
  });

  it("every model's sections are valid, non-duplicated section types", () => {
    for (const m of CV_MODELS) {
      for (const t of m.sections) {
        expect(SECTION_TYPE_SET.has(t), `${m.id}/${t}`).toBe(true);
      }
      expect(new Set(m.sections).size, `${m.id} no dup sections`).toBe(
        m.sections.length,
      );
    }
  });

  it("every titleOverride key is a section the model actually shows", () => {
    for (const m of CV_MODELS) {
      if (!m.titleOverrides) continue;
      const shown = new Set(m.sections);
      for (const key of Object.keys(m.titleOverrides) as CvSectionType[]) {
        expect(shown.has(key), `${m.id} override ${key}`).toBe(true);
        expect(
          (m.titleOverrides[key] ?? "").length,
          `${m.id} override ${key} non-empty`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("pure-narrative models omit publications entirely", () => {
    for (const id of ["ukri-r4ri", "royal-society"]) {
      const m = CV_MODELS.find((x) => x.id === id)!;
      expect(m.sections).not.toContain("publications");
      // They are all four narrative-* prose modules, no items section.
      expect(m.sections.every((t) => isProseSectionType(t))).toBe(true);
    }
  });

  it("isCvModelId guards known vs unknown ids", () => {
    expect(isCvModelId("erc")).toBe(true);
    expect(isCvModelId("europass")).toBe(true);
    expect(isCvModelId("gcp-investigator")).toBe(true);
    expect(isCvModelId("nope")).toBe(false);
  });

  it("cvModelList returns the whole catalog in order", () => {
    expect(cvModelList()).toBe(CV_MODELS);
  });

  it("cvModelsByCategory groups in the canonical category order, preserving catalog order", () => {
    const groups = cvModelsByCategory();
    expect(groups.map((g) => g.category)).toEqual([...CV_MODEL_CATEGORY_ORDER]);
    // Round-trips back to the full catalog (no model lost / duplicated).
    const flat = groups.flatMap((g) => g.models);
    expect(flat.map((m) => m.id)).toEqual(CV_MODELS.map((m) => m.id));
    // Within a group, catalog order is preserved.
    for (const g of groups) {
      const want = CV_MODELS.filter((m) => m.category === g.category).map((m) => m.id);
      expect(g.models.map((m) => m.id)).toEqual(want);
    }
  });
});

describe("applyCvModel", () => {
  it("is a no-op (identity) for an unknown id", () => {
    const cv = makeCv();
    expect(applyCvModel(cv, "unknown")).toBe(cv);
  });

  it("returns a new object reference for a known id", () => {
    const cv = makeCv();
    expect(applyCvModel(cv, "erc")).not.toBe(cv);
  });

  it("never mutates the input document", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    applyCvModel(cv, "erc");
    applyCvModel(cv, "europass");
    applyCvModel(cv, "gcp-investigator");
    expect(JSON.stringify(cv)).toBe(snapshot);
  });

  // A representative model from EACH category, exercising visibility/order/
  // titleOverrides/prose-creation across the whole shape of the catalog.
  const REPRESENTATIVE = [
    "erc", // grant, titleOverrides, publications
    "nsf", // grant, titleOverrides (Professional Preparation / Products …)
    "snsf", // grant, pure-leaning narrative + items
    "ukri-r4ri", // grant, pure narrative (no publications)
    "ccv", // grant, prose `statement` + narrative override
    "europass", // institution, titleOverride Work experience
    "academic-us", // institution, FULL, large section set
    "rirekisho", // institution, no overrides
    "gcp-investigator", // industry, statement override + skills
    "pharma-rd", // industry, CONCISE, titleOverrides
    "medical-affairs", // industry, no overrides
  ];

  for (const id of REPRESENTATIVE) {
    const model = CV_MODELS.find((m) => m.id === id)!;

    it(`${id}: sets exactly the model's section visibility`, () => {
      const next = applyCvModel(makeCv(), id);
      const want = new Set(model.sections);
      const got = visibleTypes(next);
      for (const type of want) expect(got.has(type), `${id} shows ${type}`).toBe(true);
      for (const type of got)
        expect(want.has(type as CvSectionType), `${id} hides ${type}`).toBe(true);
    });

    it(`${id}: orders visible sections in the model's sequence, hidden after`, () => {
      const next = applyCvModel(makeCv(), id);
      expect(visibleOrderedTypes(next)).toEqual([...model.sections]);
      const maxVisible = Math.max(
        ...next.sections.filter((s) => s.visible).map((s) => s.order),
        -1,
      );
      for (const s of next.sections.filter((s) => !s.visible)) {
        expect(s.order).toBeGreaterThan(maxVisible);
      }
    });

    it(`${id}: applies the model display fields + marks sectionsCustomized`, () => {
      const base = makeCv();
      const next = applyCvModel(base, id);
      const d = model.display ?? {};
      // A field the model defines is applied; one it omits keeps the prior value
      // (so a FULL/CONCISE model never clobbers the user's order/filter).
      expect(next.display.publicationsLimit).toBe(
        d.publicationsLimit ?? base.display.publicationsLimit,
      );
      expect(next.display.publicationOrder).toBe(
        d.publicationOrder ?? base.display.publicationOrder,
      );
      expect(next.display.peerReviewedOnly).toBe(
        d.peerReviewedOnly ?? base.display.peerReviewedOnly,
      );
      expect(next.display.sectionsCustomized).toBe(true);
    });

    it(`${id}: applies every titleOverride to the shown section`, () => {
      const next = applyCvModel(makeCv(), id);
      for (const [type, title] of Object.entries(model.titleOverrides ?? {})) {
        const sec = next.sections.find((s) => s.type === type)!;
        expect(sec, `${id} has ${type}`).toBeTruthy();
        expect(sec.title, `${id} ${type} title`).toBe(title);
      }
    });

    it(`${id}: creates any missing prose sections empty + visible`, () => {
      const next = applyCvModel(makeCv(), id);
      for (const type of model.sections) {
        if (!isProseSectionType(type)) continue;
        const sec = next.sections.find((s) => s.type === type)!;
        expect(sec, `${id} created ${type}`).toBeTruthy();
        expect(sec.visible).toBe(true);
        expect(sec.items).toEqual([]);
        expect(sec.body).toBe("");
      }
    });

    it(`${id}: leaves curated item data intact`, () => {
      const cv = makeCv();
      const next = applyCvModel(cv, id);
      for (const before of cv.sections) {
        const after = next.sections.find((s) => s.id === before.id)!;
        expect(after, `${id} kept ${before.id}`).toBeTruthy();
        expect(after.items).toEqual(before.items);
      }
    });

    it(`${id}: is deterministic`, () => {
      expect(applyCvModel(makeCv(), id)).toEqual(applyCvModel(makeCv(), id));
    });
  }

  it("ERC titleOverrides: Track Record / commissions of trust / fellowships", () => {
    const next = applyCvModel(makeCv(), "erc");
    expect(next.sections.find((s) => s.type === "publications")!.title).toBe(
      "Track Record — selected publications",
    );
    expect(next.sections.find((s) => s.type === "service")!.title).toBe(
      "Institutional responsibilities & commissions of trust",
    );
    expect(next.sections.find((s) => s.type === "awards")!.title).toBe(
      "Fellowships & awards",
    );
  });

  it("NSF titleOverrides include 'Professional Preparation' + 'Products'", () => {
    const next = applyCvModel(makeCv(), "nsf");
    expect(next.sections.find((s) => s.type === "education")!.title).toBe(
      "Professional Preparation",
    );
    expect(next.sections.find((s) => s.type === "publications")!.title).toBe(
      "Products",
    );
  });

  it("CCV creates a `statement` prose section with the override title", () => {
    const next = applyCvModel(makeCv(), "ccv");
    const stmt = next.sections.find((s) => s.type === "statement")!;
    expect(stmt).toBeTruthy();
    expect(stmt.body).toBe("");
    expect(stmt.title).toBe("Personal statement");
    expect(stmt.visible).toBe(true);
    // The narrative-knowledge override applies too.
    expect(
      next.sections.find((s) => s.type === "narrative-knowledge")!.title,
    ).toBe("Most significant contributions & experiences");
  });

  it("is fully reversible via a snapshot preset (round-trip restores the view)", () => {
    const cv = makeCv();
    const before = visibleTypes(cv);
    const beforeDisplay = JSON.stringify(cv.display);
    // The editor's flow: snapshot the current view FIRST, then apply the model.
    const snapped = savePreset(cv, "Before CV model");
    const snapshotId = snapped.presets[0]!.id;
    const applied = applyCvModel(snapped, "europass");
    // The view changed…
    expect(visibleOrderedTypes(applied)).not.toEqual(visibleOrderedTypes(cv));
    // …and restoring the snapshot preset (carried on the applied doc) brings the
    // section visibility + display choices back exactly (the snapshot preset's
    // contract: display + per-section visibility, item data untouched).
    const restored = applyPreset(applied, snapshotId);
    expect(visibleTypes(restored)).toEqual(before);
    expect(JSON.stringify(restored.display)).toBe(beforeDisplay);
  });

  it("preserves a prose body the user already wrote when re-applied", () => {
    let cv = makeCv();
    cv = applyCvModel(cv, "snsf");
    const sec = cv.sections.find((s) => s.type === "narrative-knowledge")!;
    cv = setSectionBody(cv, sec.id, "My real contributions.");
    const next = applyCvModel(cv, "snsf");
    expect(
      next.sections.find((s) => s.type === "narrative-knowledge")!.body,
    ).toBe("My real contributions.");
  });

  it("does not duplicate prose sections when applied twice", () => {
    let cv = applyCvModel(makeCv(), "ccv");
    cv = applyCvModel(cv, "ccv");
    for (const type of new Set(cv.sections.map((s) => s.type))) {
      if (!isProseSectionType(type)) continue;
      expect(cv.sections.filter((s) => s.type === type).length).toBeLessThanOrEqual(1);
    }
  });

  it("seeds a created section's localized title when there is no override", () => {
    const cv = makeCv("fr-FR");
    const next = applyCvModel(cv, "snsf");
    // narrative-society has no override in SNSF → localized default title.
    expect(
      next.sections.find((s) => s.type === "narrative-society")!.title,
    ).toBe("Contributions à la société au sens large");
  });
});
