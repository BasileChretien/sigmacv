import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  SECTION_TYPES,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { applyCvModel } from "@/lib/canonical/cvModels";
import { addSection, applyPreset, savePreset } from "@/lib/canonical/curate";

/**
 * A saved view and the prose sections a layout creates after it was saved.
 * The editor saves a "Before CV model" view before applying a layout; applying
 * that view afterwards must not keep the layout's narrative sections on the page.
 */
function section(type: CvSectionType): CvSection {
  return { id: type, type, title: type, visible: true, order: 0, items: [] };
}

function makeCv(): CanonicalCv {
  const types = SECTION_TYPES.filter((t) => !isProseSectionType(t));
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "view_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale: "fr-FR" },
    sections: types.map((t, i) => ({ ...section(t), order: i })),
    presets: [],
    provenance: { generatedAt: "2026-09-16T00:00:00.000Z", sources: ["manual"] },
  });
}

describe("a saved view and prose sections created after it", () => {
  it("hides the layout's narrative sections when the earlier view is applied", () => {
    const before = savePreset(makeCv(), "Before CV model");
    const presetId = before.presets![0]!.id;
    const frq = applyCvModel(before, "frq");
    const frqProse = frq.sections.filter((s) => isProseSectionType(s.type));
    expect(frqProse).toHaveLength(3);
    expect(frqProse.every((s) => s.visible)).toBe(true);
    const restored = applyPreset(frq, presetId);
    for (const s of restored.sections) {
      if (isProseSectionType(s.type)) {
        expect(s.visible, s.title).toBe(false);
      } else {
        // The item sections come back exactly as the view saw them.
        expect(s.visible, s.type).toBe(before.sections.find((b) => b.id === s.id)!.visible);
      }
    }
    // The prose text itself is kept: hiding is a view choice, not a deletion.
    expect(restored.sections.filter((s) => isProseSectionType(s.type))).toHaveLength(3);
  });

  it("keeps a prose section the view knew about in the state the view saved", () => {
    let cv = addSection(makeCv(), "narrative-knowledge");
    const proseId = cv.sections.find((s) => s.type === "narrative-knowledge")!.id;
    cv = savePreset(cv, "With narrative");
    const id = cv.presets![0]!.id;
    const hidden = {
      ...cv,
      sections: cv.sections.map((s) => (s.id === proseId ? { ...s, visible: false } : s)),
    };
    const restored = applyPreset(hidden, id);
    expect(restored.sections.find((s) => s.id === proseId)!.visible).toBe(true);
  });

  it("leaves an item section the view never saw as it is (a data section a later sync added)", () => {
    // A view saved without the Patents section: a later sync adds Patents visible.
    const base = makeCv();
    const withoutPatents = { ...base, sections: base.sections.filter((s) => s.type !== "patents") };
    const saved = savePreset(withoutPatents, "Old view");
    const id = saved.presets![0]!.id;
    const later = { ...saved, sections: [...saved.sections, { ...section("patents"), order: 99 }] };
    const restored = applyPreset(later, id);
    expect(restored.sections.find((s) => s.type === "patents")!.visible).toBe(true);
  });

  it("a legacy view with no visibility snapshot touches no section", () => {
    const frq = applyCvModel(makeCv(), "frq");
    const legacy = {
      ...frq,
      presets: [
        {
          id: "preset:legacy",
          name: "Legacy",
          display: frq.display,
          sectionVisibility: {},
          sectionOrder: [],
        },
      ],
    };
    const restored = applyPreset(legacy, "preset:legacy");
    expect(restored.sections.map((s) => s.visible)).toEqual(frq.sections.map((s) => s.visible));
  });
});
