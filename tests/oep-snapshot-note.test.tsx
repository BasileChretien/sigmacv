// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import SectionsList from "@/components/SectionsList";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { oepSnapshotDate } from "@/lib/oep/snapshot";

/**
 * The Editorial Roles section says when its Open Editors Plus roles were
 * collected, and that the dataset is yearly: a role missing or lingering is then
 * a matter of date, not an error. Only where OEP roles are listed.
 */

function role(id: string, source: CvItem["source"], text: string): CvItem {
  return {
    id,
    source,
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    displayText: text,
    meta: {},
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "oep-note",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "editorial",
        type: "editorial",
        title: "Editorial Roles",
        visible: true,
        order: 0,
        items,
      },
    ],
    provenance: { generatedAt: "2026-10-02T00:00:00.000Z", sources: ["oep"] },
  });
}

/** Sections start collapsed (rows mount on expand): open every one. */
const expandSections = () =>
  document
    .querySelectorAll<HTMLButtonElement>('button.section-toggle[aria-expanded="false"]')
    .forEach((b) => fireEvent.click(b));

const notes = () =>
  [...document.querySelectorAll(".source-snapshot-note")].map((n) => n.textContent);

function show(items: CvItem[], locale: "en-US" | "fr-FR" = "en-US") {
  render(<SectionsList cv={makeCv(items)} locale={locale} onChange={vi.fn()} />);
  expandSections();
}

beforeAll(() => {
  // jsdom implements no layout: no scrollIntoView, and no frame timing.
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(0), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
afterEach(cleanup);

describe("Editorial Roles — Open Editors Plus date note", () => {
  const oep = role("editorial:biomolecules:section-editor", "oep", "Section Editor, Biomolecules");
  const manual = role("manual-1", "manual", "Associate Editor, Therapies (2024–)");

  it("states the collection month and the yearly update above OEP roles", () => {
    show([oep, manual]);
    expect(notes()).toHaveLength(1);
    expect(notes()[0]).toContain("Open Editors Plus");
    expect(notes()[0]).toContain(`around ${oepSnapshotDate("en-US")}`);
    expect(notes()[0]).toContain("about once a year");
    expect(notes()[0]).not.toMatch(/[{}]/);
  });

  it("is written in the editor's language, date included", () => {
    show([oep], "fr-FR");
    expect(notes()[0]).toContain(`vers ${oepSnapshotDate("fr-FR")}`);
  });

  it("is absent when every role was typed by the owner", () => {
    show([manual]);
    expect(document.querySelectorAll(".cv-item-row").length).toBeGreaterThan(0);
    expect(notes()).toHaveLength(0);
  });
});
