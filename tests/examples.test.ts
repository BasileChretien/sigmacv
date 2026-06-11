import { describe, expect, it } from "vitest";
import { EXAMPLE_META, EXAMPLE_SLUGS, getExample, listExamples } from "@/lib/examples/examples";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { EXAMPLES_NAV_LABEL, examplesNavLabel } from "@/lib/i18n/guidesNav";
import { isLandingPageId } from "@/lib/i18n/landingAll";

describe("examples gallery", () => {
  const examples = listExamples();

  it("has 8 examples with unique slugs", () => {
    expect(examples).toHaveLength(8);
    expect(new Set(EXAMPLE_SLUGS).size).toBe(EXAMPLE_SLUGS.length);
    expect(EXAMPLE_SLUGS).toContain("phd-cv-computer-science");
  });

  it("every example is well-formed with resolvable cross-links", () => {
    for (const e of examples) {
      for (const v of [
        e.metaTitle,
        e.metaDescription,
        e.navLabel,
        e.heading,
        e.citationStyle,
        e.templateLabel,
        e.field,
        e.stage,
      ]) {
        expect(v.trim().length).toBeGreaterThan(0);
      }
      expect(e.intro.length).toBeGreaterThanOrEqual(1);
      for (const v of [
        e.person.name,
        e.person.credentials,
        e.person.headline,
        e.person.affiliation,
        e.person.location,
      ]) {
        expect(v.trim().length).toBeGreaterThan(0);
      }
      // A CV needs at least a couple of sections, each with content.
      expect(e.sections.length).toBeGreaterThanOrEqual(2);
      for (const s of e.sections) {
        expect(s.title.trim().length).toBeGreaterThan(0);
        expect(s.items.length).toBeGreaterThan(0);
        for (const item of s.items) expect(item.trim().length).toBeGreaterThan(0);
      }
      // Cross-links resolve to real landing/persona/topic pages.
      expect(e.related.length).toBeGreaterThan(0);
      for (const id of e.related) expect(isLandingPageId(id)).toBe(true);
    }
  });

  it("uses distinct fictional researchers (no duplicate names)", () => {
    const names = examples.map((e) => e.person.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("getExample resolves known slugs and rejects unknown", () => {
    expect(getExample("faculty-cv-physics")?.field).toBe("Physics");
    expect(getExample("nope")).toBeUndefined();
  });

  it("EXAMPLE_META has an entry for every slug", () => {
    expect(Object.keys(EXAMPLE_META).sort()).toEqual([...EXAMPLE_SLUGS].sort());
  });
});

describe("examplesNavLabel", () => {
  it("is defined non-empty for all 10 locales and falls back to English", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(EXAMPLES_NAV_LABEL[loc].length).toBeGreaterThan(0);
      expect(examplesNavLabel(loc)).toBe(EXAMPLES_NAV_LABEL[loc]);
    }
    expect(examplesNavLabel("xx-XX")).toBe(EXAMPLES_NAV_LABEL["en-US"]);
  });
});
