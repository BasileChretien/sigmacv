import { describe, expect, it, vi } from "vitest";

// Static imports are hoisted above any env assignment, so the site-URL helper
// (which reads the validated env) is mocked rather than configured.
// The envelope imports the comparison module for its skew threshold; that module
// reaches the database client, which reads the env at import. Neither is used here.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/siteUrl", () => ({ absoluteUrl: (path: string) => `https://sigmacv.test/${path}` }));

import type { InstitutionComparison } from "@/lib/institutions/compare";
import {
  CC0_URL,
  COMPARE_METHOD_VERSION,
  comparisonExport,
} from "@/lib/institutions/compareExport";

const A = "04chrp450";
const B = "03xjwb503";

const comparison: InstitutionComparison = {
  columns: [
    {
      rorId: A,
      name: "Nagoya University",
      country: "JP",
      openalexId: "I60134161",
      foldedIds: ["I60134161", "I4210121234"],
      foldedCount: 2,
      countedWorkTypes: ["article", "review"],
      fetchedAt: "2026-09-01T00:00:00.000Z",
      years: { from: 2020, to: 2026 },
      rows: [
        {
          year: 2024,
          known: 6135,
          open: 3964,
          closed: 2171,
          percent: 65,
          withheld: null,
          statuses: { gold: 3964, closed: 2171 },
        },
        {
          year: 2026,
          known: 10,
          open: 5,
          closed: 5,
          percent: null,
          withheld: "partial-year",
          statuses: { gold: 5, closed: 5 },
        },
      ],
      domains: { total: 6200, byDomain: [{ id: "4", name: "Health Sciences", count: 5000 }] },
    },
    {
      rorId: B,
      name: "Université de Caen Normandie",
      country: "FR",
      openalexId: "I98702875",
      foldedIds: ["I98702875"],
      foldedCount: 1,
      countedWorkTypes: ["article"],
      fetchedAt: "2026-09-03T00:00:00.000Z",
      years: { from: 2020, to: 2026 },
      rows: [
        {
          year: 2024,
          known: 1230,
          open: 400,
          closed: 830,
          percent: 33,
          withheld: null,
          statuses: { gold: 400, closed: 830 },
        },
      ],
      domains: undefined,
    },
  ],
  dropped: [{ rorId: "027arzy69", reason: "no-page" }],
  commonYears: [2020, 2021, 2022, 2023, 2024, 2025],
  skewed: false,
  canonicalIds: [B, A].sort(),
};

describe("comparisonExport", () => {
  const out = comparisonExport(comparison, new Date("2026-09-10T12:00:00.000Z"));

  it("carries the method, the licence, a citation naming OpenAlex and the snapshot dates, and the arrangement", () => {
    expect(out.method).toBe(COMPARE_METHOD_VERSION);
    expect(out.license).toBe("CC0-1.0");
    expect(out.licenseUrl).toBe(CC0_URL);
    expect(out.citation).toContain("OpenAlex (CC0)");
    expect(out.citation).toContain("arXiv:2205.01833");
    expect(out.citation).toContain("snapshots of 2026-09-01, 2026-09-03");
    expect(out.citation).toContain("https://sigmacv.test/i/compare");
    expect(out.generatedAt).toBe("2026-09-10T12:00:00.000Z");
    // The rules a reuser needs to divide the way the page does, with the tokens explained.
    expect(out.rules).toEqual({
      minWorksWithStatus: 100,
      snapshotSkewDays: 30,
      notStatedBecause: {
        "partial-year": expect.stringContaining("not over"),
        "small-denominator": expect.stringContaining("minWorksWithStatus"),
        "snapshot-skew": expect.stringContaining("snapshotSkewDays"),
      },
    });
    expect(out.commonYears).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
    expect(out.skewed).toBe(false);
    expect(out.dropped).toEqual([{ rorId: "027arzy69", reason: "no-page" }]);
    expect(comparisonExport({ ...comparison, skewed: true }, new Date()).skewed).toBe(true);
  });

  it("gives each organisation its identifiers, folded entities, counted types, date, window, count rows and domains (null when absent)", () => {
    expect(out.organisations.map((o) => o.name)).toEqual([
      "Nagoya University",
      "Université de Caen Normandie",
    ]);
    const nagoya = out.organisations[0]!;
    expect(nagoya).toMatchObject({
      rorId: A,
      ror: `https://ror.org/${A}`,
      country: "JP",
      openalexId: "I60134161",
      openalex: "https://openalex.org/I60134161",
      foldedIds: ["I60134161", "I4210121234"],
      countedWorkTypes: ["article", "review"],
      fetchedAt: "2026-09-01T00:00:00.000Z",
      years: { from: 2020, to: 2026 },
    });
    expect(nagoya.rows).toEqual([
      {
        year: 2024,
        worksWithStatus: 6135,
        openCopies: 3964,
        noneFound: 2171,
        byStatus: { gold: 3964, closed: 2171 },
        notStatedBecause: null,
      },
      {
        year: 2026,
        worksWithStatus: 10,
        openCopies: 5,
        noneFound: 5,
        byStatus: { gold: 5, closed: 5 },
        notStatedBecause: "partial-year",
      },
    ]);
    expect(nagoya.domains).toEqual({
      total: 6200,
      byDomain: [{ id: "4", name: "Health Sciences", count: 5000 }],
    });
    expect(out.organisations[1]!.domains).toBeNull();
  });

  it("carries counts only: no share, percent, ratio or rank anywhere — and nothing consented", () => {
    const json = JSON.stringify(out);
    for (const banned of [
      "percent",
      "share",
      "ratio",
      "rank",
      "score",
      "%",
      "listed",
      '"count":6',
    ]) {
      expect(json, banned).not.toContain(banned);
    }
    // The stated shares of the page (65, 33) never appear as numbers.
    expect(json).not.toMatch(/:\s*65\b|:\s*33\b/);
  });
});
