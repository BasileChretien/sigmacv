import { beforeEach, describe, expect, it, vi } from "vitest";

const lookup = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openalex/repositories", () => ({ fetchAuthorRepositories: lookup }));

import {
  DEPOSIT_REPOSITORIES_REFRESH_DAYS,
  enrichCvWithDepositRepositories,
} from "@/lib/archiving/depositRepositoriesPass";
import { answeredWithin } from "@/lib/archiving/freshness";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";

/**
 * The owner sync's repository pass: two OpenAlex calls at most once a week, the
 * places kept as names and links only, a failure keeping what the owner had.
 */

const NOW = "2026-09-15T00:00:00.000Z";
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();
const HAL_ROW = { sourceId: "S4306402512", name: "HAL", url: "https://hal.science/submit" };

function cvWith(owner: Partial<CanonicalCv["owner"]> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "rp",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A5001069481", "A5136414971"],
      displayName: "Owner",
      ...owner,
    },
    display: {},
    sections: [],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

beforeEach(() => lookup.mockReset());

describe("enrichCvWithDepositRepositories", () => {
  it("stores the places the owner's works sit — names and links, no counts — and when it asked", async () => {
    lookup.mockResolvedValue([
      {
        sourceId: "S4306402512",
        name: "HAL (CCSD)",
        homepageUrl: "https://hal.science",
        works: 34,
      },
      { sourceId: "S4306525036", name: "PubMed", works: 85 },
    ]);
    const out = await enrichCvWithDepositRepositories(cvWith(), NOW);
    expect(lookup).toHaveBeenCalledWith(["A5001069481", "A5136414971"]);
    expect(out.owner.depositRepositories).toEqual([HAL_ROW]);
    expect(out.owner.depositRepositoriesCheckedAt).toBe(NOW);
    expect(JSON.stringify(out.owner.depositRepositories)).not.toMatch(/works|34|85/);
    expect(CanonicalCvSchema.parse(out)).toEqual(out);
  });

  it(`does not ask again within ${DEPOSIT_REPOSITORIES_REFRESH_DAYS} days`, async () => {
    const cv = cvWith({ depositRepositories: [HAL_ROW], depositRepositoriesCheckedAt: daysAgo(2) });
    expect(await enrichCvWithDepositRepositories(cv, NOW)).toBe(cv);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("keeps what the owner had when the lookup fails, and clears it on an empty answer", async () => {
    const stored = cvWith({
      depositRepositories: [HAL_ROW],
      depositRepositoriesCheckedAt: daysAgo(30),
    });
    lookup.mockResolvedValueOnce(undefined);
    expect(await enrichCvWithDepositRepositories(stored, NOW)).toBe(stored);
    lookup.mockResolvedValueOnce([]);
    const cleared = await enrichCvWithDepositRepositories(stored, NOW);
    expect(cleared.owner.depositRepositories).toBeUndefined();
    expect(cleared.owner.depositRepositoriesCheckedAt).toBe(NOW);
  });
});

describe("answeredWithin", () => {
  it("is true only for a readable, past answer inside the window", () => {
    expect(answeredWithin(undefined, NOW, 7)).toBe(false);
    expect(answeredWithin("garbled", NOW, 7)).toBe(false);
    expect(answeredWithin(daysAgo(-1), NOW, 7)).toBe(false);
    expect(answeredWithin(daysAgo(6), NOW, 7)).toBe(true);
    expect(answeredWithin(daysAgo(7), NOW, 7)).toBe(false);
  });
});
