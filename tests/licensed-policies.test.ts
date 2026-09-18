import { describe, expect, it } from "vitest";
import { withoutLicensedPolicies } from "@/lib/cv/licensedPolicies";

/** Open Policy Finder records never leave the editor; OA.Works ones may. */
describe("withoutLicensedPolicies", () => {
  const doc = {
    schemaVersion: 2,
    sections: [
      {
        id: "pubs",
        items: [
          {
            id: "opf",
            meta: {
              year: 2020,
              selfArchiving: { source: "open-policy-finder", versions: ["acceptedVersion"] },
              selfArchivingCheckedAt: "2026-09-18",
              selfArchivingTriedAt: "2026-09-18",
              selfArchivingOpfAt: "2026-09-18",
            },
          },
          { id: "oaw", meta: { selfArchiving: { source: "oa.works" } } },
          { id: "none", meta: { year: 2021 } },
          { id: "bare" },
        ],
      },
      { id: "noitems" },
    ],
  };

  it("drops Open Policy Finder records with their stamps, keeps everything else, and never mutates", () => {
    const copy = JSON.parse(JSON.stringify(doc));
    const out = withoutLicensedPolicies(doc);
    expect(doc).toEqual(copy);
    const items = out.sections[0]!.items!;
    expect(items[0]).toEqual({ id: "opf", meta: { year: 2020 } });
    expect(items[1]).toEqual(doc.sections[0]!.items![1]);
    expect(items[2]).toBe(doc.sections[0]!.items![2]);
    expect(items[3]).toBe(doc.sections[0]!.items![3]);
    expect(out.sections[1]).toBe(doc.sections[1]);
  });

  it("passes any other shape through untouched", () => {
    expect(withoutLicensedPolicies(null)).toBeNull();
    expect(withoutLicensedPolicies("text")).toBe("text");
    const noSections = { schemaVersion: 2 };
    expect(withoutLicensedPolicies(noSections)).toBe(noSections);
  });
});
