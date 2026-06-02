import { describe, expect, it } from "vitest";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderBibliography } from "@/lib/citeproc/engine";
import { workToCsl } from "@/lib/openalex/toCsl";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const hasApa = listAvailableStyles().includes("apa");

// These tests need the vendored CSL assets — run `npm run fetch-csl` first.
describe.skipIf(!hasApa)("renderBibliography (vendored CSL assets)", () => {
  const items = works.map(workToCsl);

  it("renders one entry per item", () => {
    expect(renderBibliography(items, "apa").length).toBe(items.length);
  });

  it("maps each entry back to its item id", () => {
    const ids = renderBibliography(items, "apa")
      .map((e) => e.id)
      .sort();
    expect(ids).toEqual(items.map((i) => i.id).sort());
  });

  it("formats author, year, and title into the entry HTML", () => {
    const joined = renderBibliography(items, "apa")
      .map((e) => e.content)
      .join("\n");
    expect(joined).toContain("Chrétien");
    expect(joined).toContain("2023");
    expect(joined).toContain("adverse drug reactions");
  });

  it("falls back to the default style for an unknown style key", () => {
    expect(renderBibliography(items, "does-not-exist").length).toBe(
      items.length,
    );
  });
});
