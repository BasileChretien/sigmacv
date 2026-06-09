import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/crossref/client", () => ({ fetchCrossrefRelations: vi.fn() }));

import { fetchCrossrefRelations } from "@/lib/crossref/client";
import { annotateDuplicatesWithRelations } from "@/lib/cv/duplicateRelations";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";

const mockRelations = vi.mocked(fetchCrossrefRelations);
const DISPLAY = DisplayChoicesSchema.parse({});
const MAILTO = "ci@example.org";

function cite(id: string, title: string, doi: string, year: number, peerReviewed = false): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    csl: { id, type: "article-journal", title, DOI: doi, author: [{ family: "Smith" }] },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: { year, doi, peerReviewed },
  };
}

function cvWithPair(): CanonicalCv {
  const sections: Array<{ id: string; type: CvSectionType; items: CvItem[] }> = [
    {
      id: "publications",
      type: "publications",
      items: [cite("W_pub", "Shared Title", "10.1/pub", 2024, true)],
    },
    {
      id: "preprints",
      type: "preprints",
      items: [cite("W_pre", "Shared Title", "10.1101/pre", 2023)],
    },
  ];
  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: "cv",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "T",
      links: [],
      countsByYear: [],
    },
    display: DISPLAY,
    sections: sections.map((s, i) => ({
      id: s.id,
      type: s.type,
      title: s.id,
      visible: true,
      order: i,
      items: s.items,
    })),
    presets: [],
    provenance: { generatedAt: "2026-01-01T00:00:00.000Z", sources: ["openalex"] },
  };
}

function preprintHint(cv: CanonicalCv) {
  const pre = cv.sections.find((s) => s.id === "preprints")!.items[0]!;
  return pre.meta.duplicateOf;
}

beforeEach(() => mockRelations.mockReset());

describe("annotateDuplicatesWithRelations", () => {
  it("upgrades an ambiguous pair to the 'related' tier from a Crossref relation", async () => {
    mockRelations.mockImplementation(async (doi: string) =>
      doi === "10.1101/pre" ? [{ target: "10.1/pub", kind: "preprint-pair" }] : [],
    );
    const out = await annotateDuplicatesWithRelations(cvWithPair(), MAILTO);
    expect(preprintHint(out)).toMatchObject({
      tier: "related",
      relationship: "preprint-of",
      itemId: "W_pub",
    });
    // Only the two candidate DOIs were looked up.
    expect(mockRelations).toHaveBeenCalledTimes(2);
  });

  it("returns the CV unchanged when Crossref reports no relations", async () => {
    mockRelations.mockResolvedValue([]);
    const input = cvWithPair();
    const out = await annotateDuplicatesWithRelations(input, MAILTO);
    expect(out).toBe(input);
  });

  it("does nothing (no lookups) when there are no ambiguous pairs", async () => {
    const noDup: CanonicalCv = {
      ...cvWithPair(),
      sections: [cvWithPair().sections[0]!], // a single work, no partner
    };
    const out = await annotateDuplicatesWithRelations(noDup, MAILTO);
    expect(out).toBe(noDup);
    expect(mockRelations).not.toHaveBeenCalled();
  });

  it("ignores a failing lookup but still applies a successful one (per-call fail-soft)", async () => {
    mockRelations.mockImplementation(async (doi: string) => {
      if (doi === "10.1101/pre") throw new Error("network down"); // one lookup fails
      return [{ target: "10.1101/pre", kind: "preprint-pair" }]; // the other asserts the link
    });
    const out = await annotateDuplicatesWithRelations(cvWithPair(), MAILTO);
    expect(preprintHint(out)).toMatchObject({ tier: "related", relationship: "preprint-of" });
  });
});
