import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import type { CanonicalCv } from "@/lib/canonical/schema";

function makeCv(overrides: Partial<CanonicalCv["owner"]> = {}): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "j",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  return { ...cv, owner: { ...cv.owner, ...overrides } };
}

describe("profilePageJsonLd", () => {
  it("describes a ProfilePage/Person with the ORCID as sameAs", () => {
    const json = profilePageJsonLd(makeCv({ headline: "Pharmacovigilance researcher" }), "basile-chretien-abcd");
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("ProfilePage");
    expect(parsed.url).toContain("/p/basile-chretien-abcd");
    expect(parsed.mainEntity["@type"]).toBe("Person");
    expect(parsed.mainEntity.name).toBe("Basile Chrétien");
    expect(parsed.mainEntity.jobTitle).toBe("Pharmacovigilance researcher");
    expect(parsed.mainEntity.sameAs).toContain("https://orcid.org/0000-0002-7483-2489");
  });

  it("escapes < so it is safe inside an HTML <script> element", () => {
    const json = profilePageJsonLd(makeCv({ displayName: "</script><b>x" }), "s");
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c");
    // Still valid JSON after escaping.
    expect(JSON.parse(json).mainEntity.name).toBe("</script><b>x");
  });
});
