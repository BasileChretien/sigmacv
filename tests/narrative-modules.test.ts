import { describe, expect, it } from "vitest";
import { hasUnfilledNarrativeModules, isUnfilledNarrativeModule } from "@/lib/ai/sections";
import type { CanonicalCv, CvSection } from "@/lib/canonical/schema";

/** A narrative (prose) section; overridable per-case. */
function section(over: Partial<CvSection> = {}): CvSection {
  return {
    id: "s",
    type: "narrative-knowledge",
    title: "Contributions to knowledge",
    visible: true,
    order: 0,
    items: [],
    body: "",
    ...over,
  } as CvSection;
}

function cv(sections: CvSection[]): CanonicalCv {
  return { sections } as CanonicalCv;
}

describe("isUnfilledNarrativeModule", () => {
  it("is true for a visible narrative module with an empty or whitespace body", () => {
    expect(isUnfilledNarrativeModule(section({ body: "" }))).toBe(true);
    expect(isUnfilledNarrativeModule(section({ body: "   \n" }))).toBe(true);
    expect(isUnfilledNarrativeModule(section({ body: undefined }))).toBe(true);
  });

  it("is false once the module has real prose", () => {
    expect(isUnfilledNarrativeModule(section({ body: "I contributed…" }))).toBe(false);
  });

  it("is false for a hidden narrative module", () => {
    expect(isUnfilledNarrativeModule(section({ visible: false }))).toBe(false);
  });

  it("is false for a non-narrative section, however empty", () => {
    expect(isUnfilledNarrativeModule(section({ type: "publications", body: undefined }))).toBe(
      false,
    );
    expect(isUnfilledNarrativeModule(section({ type: "statement", body: "" }))).toBe(false);
  });
});

describe("hasUnfilledNarrativeModules", () => {
  it("is true when any narrative module is still blank", () => {
    expect(
      hasUnfilledNarrativeModules(
        cv([
          section({ id: "a", type: "publications", body: undefined }),
          section({ id: "b", type: "narrative-society", body: "" }),
        ]),
      ),
    ).toBe(true);
  });

  it("is false when every narrative module is written (or none exist)", () => {
    expect(
      hasUnfilledNarrativeModules(
        cv([
          section({ id: "a", type: "narrative-knowledge", body: "Done." }),
          section({ id: "b", type: "publications", body: undefined }),
        ]),
      ),
    ).toBe(false);
    expect(hasUnfilledNarrativeModules(cv([]))).toBe(false);
  });
});
