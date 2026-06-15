import { describe, expect, it } from "vitest";
import { dismissReviewCandidate } from "@/lib/canonical/curate";
import { similarVisibleForOrcidCandidates } from "@/lib/canonical/duplicates";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";

const DISPLAY = DisplayChoicesSchema.parse({});

function item(over: Partial<CvItem> & { id: string }): CvItem {
  return {
    source: "openalex",
    sourceId: over.id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

/** A citation item (orcid-doi candidates and visible publications both carry CSL). */
function cite(id: string, title: string, over: Partial<CvItem> = {}): CvItem {
  const csl = { id, type: "article-journal", title } as NonNullable<CvItem["csl"]>;
  if (over.meta?.doi) csl.DOI = over.meta.doi;
  return item({ id, csl, ...over });
}

function cv(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
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
    display: DisplayChoicesSchema.parse({ ...DISPLAY, ...display }),
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
    ],
    presets: [],
    provenance: { generatedAt: "2026-01-01T00:00:00.000Z", sources: ["openalex"] },
  };
}

describe("dismissReviewCandidate", () => {
  it("records the id, keeps it hidden, and survives via display state", () => {
    const before = cv([item({ id: "W1", included: false, meta: { reviewFlag: "orcid-doi" } })]);
    const out = dismissReviewCandidate(before, "publications", "W1");
    expect(out.display.dismissedReviewCandidates).toEqual(["W1"]);
    expect(out.sections[0]!.items[0]!.included).toBe(false);
    // Pure: never records a "not mine" disambiguation claim.
    expect(out.sections[0]!.items[0]!.notMine).toBe(false);
  });

  it("forces an accidentally-shown candidate back to hidden", () => {
    const before = cv([item({ id: "G1", included: true, meta: { reviewFlag: "name-matched" } })]);
    const out = dismissReviewCandidate(before, "publications", "G1");
    expect(out.display.dismissedReviewCandidates).toEqual(["G1"]);
    expect(out.sections[0]!.items[0]!.included).toBe(false);
  });

  it("is idempotent once dismissed and hidden", () => {
    const once = dismissReviewCandidate(
      cv([item({ id: "W1", included: false, meta: { reviewFlag: "orcid-doi" } })]),
      "publications",
      "W1",
    );
    expect(dismissReviewCandidate(once, "publications", "W1")).toBe(once);
  });

  it("is a no-op for a missing item or section", () => {
    const base = cv([item({ id: "W1", included: false, meta: { reviewFlag: "orcid-doi" } })]);
    expect(dismissReviewCandidate(base, "publications", "missing")).toBe(base);
    expect(dismissReviewCandidate(base, "missing", "W1")).toBe(base);
  });
});

describe("similarVisibleForOrcidCandidates", () => {
  it("flags a pending candidate whose title matches a shown work", () => {
    const out = similarVisibleForOrcidCandidates(
      cv([
        cite("W1", "Deep Learning for Genomics"),
        cite("W2", "Deep Learning for Genomics", {
          included: false,
          meta: { reviewFlag: "orcid-doi" },
        }),
      ]),
    );
    expect(out.get("W2")).toBe("Deep Learning for Genomics");
  });

  it("matches by shared DOI even when titles differ", () => {
    const out = similarVisibleForOrcidCandidates(
      cv([
        cite("W1", "The published version", { meta: { doi: "10.1/x" } }),
        cite("W2", "Preprint working title", {
          included: false,
          meta: { reviewFlag: "orcid-doi", doi: "10.1/x" },
        }),
      ]),
    );
    expect(out.get("W2")).toBe("The published version");
  });

  it("matches by shared PMID", () => {
    const out = similarVisibleForOrcidCandidates(
      cv([
        cite("W1", "A shown paper", { meta: { pmid: "12345" } }),
        cite("W2", "Quite different wording entirely", {
          included: false,
          meta: { reviewFlag: "orcid-doi", pmid: "12345" },
        }),
      ]),
    );
    expect(out.get("W2")).toBe("A shown paper");
  });

  it("matches a near-identical title via trigram similarity", () => {
    const out = similarVisibleForOrcidCandidates(
      cv([
        cite("W1", "Neural networks in clinical medicine"),
        cite("W2", "Neural networks in clinical medecine", {
          included: false,
          meta: { reviewFlag: "orcid-doi" },
        }),
      ]),
    );
    expect(out.get("W2")).toBe("Neural networks in clinical medicine");
  });

  it("ignores candidates with no match, and non-pending or non-orcid-doi items", () => {
    const out = similarVisibleForOrcidCandidates(
      cv([
        cite("W1", "Photosynthesis in deep-sea vents"),
        // unrelated pending candidate → no match
        cite("W2", "A totally unrelated subject", {
          included: false,
          meta: { reviewFlag: "orcid-doi" },
        }),
        // same title but already shown (not pending) → not a candidate
        cite("W3", "Photosynthesis in deep-sea vents", { meta: { reviewFlag: "orcid-doi" } }),
        // same title but marked not-mine → not a candidate
        cite("W4", "Photosynthesis in deep-sea vents", {
          included: false,
          notMine: true,
          meta: { reviewFlag: "orcid-doi" },
        }),
      ]),
    );
    expect(out.size).toBe(0);
  });
});
