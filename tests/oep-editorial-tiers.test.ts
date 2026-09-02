import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv, type CvItem } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { EditorialRole } from "@/lib/oep/client";

/**
 * Open Editors Plus attributes an editorship in three ways: the publisher
 * printed the ORCID ("scraped"), OEP propagated an ORCID from another row of
 * the same unambiguous name ("propagated"), or OEP resolved an OpenAlex author
 * from name + institution ("openalex"). Only the first is strong enough to write
 * onto a CV unasked; the other two are review candidates.
 *
 * Motivating case: David Montani is editor-in-chief of Respiratory Medicine and
 * Research (Elsevier, no ORCID printed) and a section editor of Biomolecules
 * (MDPI, ORCID printed). An ORCID-only join showed only the MDPI role.
 */

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-9358-6922",
  authorIds: ["A5078054842"],
  displayName: "David Montani",
};

const SCRAPED: EditorialRole = {
  journal: "Biomolecules",
  role: "Section Board Member",
  trust: "scraped",
};
const PROPAGATED: EditorialRole = {
  journal: "Respiratory Medicine and Research",
  role: "Editor-in-chief",
  trust: "propagated",
};
const OPENALEX: EditorialRole = {
  journal: "European Respiratory Journal",
  role: "Associate Editor",
  trust: "openalex",
};

function build(editorialRoles: EditorialRole[], previous?: ReturnType<typeof buildCanonicalCv>) {
  return buildCanonicalCv({
    id: "cv_test",
    resolved,
    works: [],
    editorialRoles,
    now: "2026-09-02T00:00:00.000Z",
    previous,
  });
}

function editorial(cv: ReturnType<typeof buildCanonicalCv>): CvItem[] {
  return cv.sections.find((s) => s.id === "editorial")?.items ?? [];
}

function byJournal(cv: ReturnType<typeof buildCanonicalCv>, journal: string): CvItem {
  const needle = journal.toLowerCase().slice(0, 12);
  const found = editorial(cv).find((i) => (i.displayText ?? "").toLowerCase().includes(needle));
  if (!found) throw new Error(`no editorial item for ${journal}`);
  return found;
}

describe("OEP editorial-role trust tiers", () => {
  it("auto-includes a scraped ORCID match", () => {
    const item = byJournal(build([SCRAPED]), "Biomolecules");
    expect(item.included).toBe(true);
    expect(item.meta.reviewFlag).toBeUndefined();
  });

  it("treats a role with no trust (manual entry) as auto-included", () => {
    const item = byJournal(build([{ journal: "Biomolecules", role: "Editor" }]), "Biomolecules");
    expect(item.included).toBe(true);
  });

  it("surfaces a propagated ORCID match as a hidden review candidate", () => {
    const item = byJournal(build([PROPAGATED]), "Respiratory Medicine");
    expect(item.included).toBe(false);
    expect(item.meta.reviewFlag).toBe("name-matched");
  });

  it("surfaces an OpenAlex-resolved match as a hidden review candidate", () => {
    const item = byJournal(build([OPENALEX]), "European Respiratory");
    expect(item.included).toBe(false);
    expect(item.meta.reviewFlag).toBe("name-matched");
  });

  it("shows the Montani editor-in-chief role that an ORCID-only join dropped", () => {
    const cv = build([SCRAPED, PROPAGATED]);
    expect(editorial(cv)).toHaveLength(2);
    expect(byJournal(cv, "Respiratory Medicine").displayText).toContain("Editor-in-chief");
  });

  it("keeps the scraped tier when both tiers describe the same editorship", () => {
    // Candidate listed first, to prove ordering is by trust and not by input.
    const cv = build([{ ...SCRAPED, trust: "openalex" }, SCRAPED]);
    expect(editorial(cv)).toHaveLength(1);
    expect(editorial(cv)[0]!.included).toBe(true);
    expect(editorial(cv)[0]!.meta.reviewFlag).toBeUndefined();
  });

  it("honours a confirmed candidate across a re-sync", () => {
    const first = build([PROPAGATED]);
    const confirmed = {
      ...first,
      sections: first.sections.map((s) =>
        s.id === "editorial" ? { ...s, items: s.items.map((i) => ({ ...i, included: true })) } : s,
      ),
    };
    const resynced = build([PROPAGATED], confirmed);
    expect(byJournal(resynced, "Respiratory Medicine").included).toBe(true);
  });

  it("honours a rejected candidate across a re-sync", () => {
    const first = build([PROPAGATED]);
    const resynced = build([PROPAGATED], first);
    expect(byJournal(resynced, "Respiratory Medicine").included).toBe(false);
  });

  it("does not hide a scraped role the user had already accepted", () => {
    const first = build([SCRAPED]);
    const resynced = build([SCRAPED], first);
    expect(byJournal(resynced, "Biomolecules").included).toBe(true);
  });

  it("still produces a schema-valid CV with mixed tiers", () => {
    expect(() => parseCanonicalCv(build([SCRAPED, PROPAGATED, OPENALEX]))).not.toThrow();
  });

  it("omits the section entirely when there are no roles", () => {
    expect(build([]).sections.find((s) => s.id === "editorial")).toBeUndefined();
  });
});
