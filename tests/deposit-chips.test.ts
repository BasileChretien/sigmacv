import { describe, expect, it } from "vitest";
import { depositCandidate, depositChips } from "@/lib/archiving/depositChips";
import type { DepositContext } from "@/lib/archiving/depositRoutes";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The deposit chips: one per countable journal article with no open copy found,
 * reading the same routes and the same record as the worklist row — so a chip
 * on a publication row and the action in the Open access tab never disagree.
 */

type SelfArchiving = NonNullable<CvItem["meta"]["selfArchiving"]>;
const record = (over: Partial<SelfArchiving> = {}): SelfArchiving => ({
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: [],
  retrievedAt: "2026-09-15T00:00:00.000Z",
  ...over,
});

function work(id: string, meta: CvItem["meta"] = {}, csl: Record<string, unknown> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}`, ...csl },
    meta: { year: 2023, oaIsOpen: false, workCountries: ["FR"], ...meta },
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "chips",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

const CTX: DepositContext = { basis: "paper", crosswalk: new Map() };
const TODAY = "2026-09-16";

describe("depositChips", () => {
  it("gives a closed journal article the worklist's first route, and says how far the record lets it go", () => {
    const chips = depositChips(
      makeCv([
        work("W-unrecorded"),
        work("W-version", { selfArchiving: record() }),
        work("W-refused", { selfArchiving: record({ canArchive: false }) }),
        // A place the record does not name, with the right not yet run (2026).
        work("W-conditional", {
          year: 2026,
          selfArchiving: record({ locations: ["Preprint Server"] }),
        }),
      ]),
      CTX,
      TODAY,
    );
    // No record, but the French right has run for a 2023 paper: the law is the ground.
    expect(chips.get("W-unrecorded")).toEqual({ destination: "HAL", kind: "version" });
    expect(chips.get("W-version")).toEqual({ destination: "HAL", kind: "version" });
    // A refusal on record, but the French right has run: the law is the ground.
    expect(chips.get("W-refused")).toEqual({ destination: "HAL", kind: "version" });
    expect(chips.get("W-conditional")).toEqual({ destination: "HAL", kind: "conditional" });
  });

  it("gives no chip to a work with no ground today: under a running embargo, a refusal with no right, a right not yet run", () => {
    const chips = depositChips(
      makeCv([
        work("W-embargo", {
          workCountries: [],
          selfArchiving: record({ embargoEnd: "2031-01-01" }),
        }),
        work("W-refused-nowhere", {
          workCountries: [],
          selfArchiving: record({ canArchive: false }),
        }),
        work("W-too-new", { year: 2026 }),
        work("W-nothing", { workCountries: [] }),
      ]),
      CTX,
      TODAY,
    );
    expect(chips.size).toBe(0);
  });

  it("gives no chip to an open work, a non-article, a hidden work or one marked not mine", () => {
    const chips = depositChips(
      makeCv([
        work("W-open", { oaIsOpen: true }),
        work("W-chapter", {}, { type: "chapter" }),
        { ...work("W-hidden"), included: false },
        { ...work("W-notmine"), notMine: true },
        work("W-closed"),
      ]),
      CTX,
      TODAY,
    );
    expect([...chips.keys()]).toEqual(["W-closed"]);
  });

  it("follows the deposit basis: the owner's current affiliation changes the destination", () => {
    const cv = makeCv([work("W1")]);
    expect(depositChips(cv, CTX, TODAY).get("W1")?.destination).toBe("HAL");
    expect(
      depositChips(cv, { basis: "current", currentCountry: "JP", crosswalk: new Map() }, TODAY).get(
        "W1",
      )?.destination,
    ).toBe("Zenodo");
  });

  it("depositCandidate keeps journal articles only", () => {
    expect(depositCandidate(undefined)).toBeUndefined();
    expect(depositCandidate(work("W-chapter", {}, { type: "chapter" }))).toBeUndefined();
    expect(depositCandidate(work("W1"))?.id).toBe("W1");
  });
});
