import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateOwner } from "@/lib/canonical/curate";
import { CvOwnerSchema } from "@/lib/canonical/schema";
import { safeHref } from "@/lib/render/escape";
import { headerHtml } from "@/lib/render/templates/shared";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function emptyCv() {
  return buildCanonicalCv({ id: "p", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
}

describe("safeHref", () => {
  it("passes http(s) and mailto through", () => {
    expect(safeHref("https://example.org")).toBe("https://example.org");
    expect(safeHref("http://example.org/x")).toBe("http://example.org/x");
    expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
  });
  it("upgrades a bare domain to https", () => {
    expect(safeHref("example.org/me")).toBe("https://example.org/me");
  });
  it("rejects dangerous schemes and empties", () => {
    expect(safeHref("javascript:alert(1)")).toBe("");
    expect(safeHref("data:text/html,<script>")).toBe("");
    expect(safeHref("vbscript:msgbox")).toBe("");
    expect(safeHref("")).toBe("");
    expect(safeHref(undefined)).toBe("");
  });
});

describe("CvOwnerSchema", () => {
  it("accepts a full profile", () => {
    const parsed = CvOwnerSchema.parse({
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "X",
      headline: "Assistant Professor",
      summary: "Pharmacovigilance researcher.",
      photo: PNG,
      contact: { email: "a@b.com", location: "Nagoya" },
      links: [{ label: "Site", url: "https://x.org" }],
      personal: { dateOfBirth: "1990-01-01", nationality: "French" },
    });
    expect(parsed.headline).toBe("Assistant Professor");
    expect(parsed.contact?.email).toBe("a@b.com");
    expect(parsed.links).toHaveLength(1);
  });
  it("rejects a photo that isn't an image data URL", () => {
    expect(
      CvOwnerSchema.safeParse({
        orcid: "x",
        openAlexAuthorIds: [],
        displayName: "X",
        photo: "data:text/html;base64,PHNjcmlwdD4=",
      }).success,
    ).toBe(false);
  });
  it("rejects an SVG photo (can carry scripts) but accepts raster formats", () => {
    const base = { orcid: "x", openAlexAuthorIds: [], displayName: "X" };
    expect(
      CvOwnerSchema.safeParse({
        ...base,
        photo: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      }).success,
    ).toBe(false);
    expect(CvOwnerSchema.safeParse({ ...base, photo: PNG }).success).toBe(true);
    expect(
      CvOwnerSchema.safeParse({
        ...base,
        photo: "data:image/webp;base64,UklGRg==",
      }).success,
    ).toBe(true);
  });
  it("defaults links to an empty array", () => {
    const p = CvOwnerSchema.parse({ orcid: "x", openAlexAuthorIds: [], displayName: "X" });
    expect(p.links).toEqual([]);
  });
});

describe("updateOwner", () => {
  it("shallow-merges top-level fields immutably", () => {
    const cv = emptyCv();
    const next = updateOwner(cv, { headline: "Prof" });
    expect(next.owner.headline).toBe("Prof");
    expect(cv.owner.headline).toBeUndefined(); // original untouched
    expect(next).not.toBe(cv);
  });
  it("merges nested contact without dropping siblings", () => {
    const cv = updateOwner(emptyCv(), { contact: { email: "a@b.com" } });
    const next = updateOwner(cv, { contact: { phone: "123" } });
    expect(next.owner.contact).toEqual({ email: "a@b.com", phone: "123" });
  });
  it("merges nested personal without dropping siblings", () => {
    const cv = updateOwner(emptyCv(), { personal: { nationality: "French" } });
    const next = updateOwner(cv, { personal: { gender: "M" } });
    expect(next.owner.personal).toEqual({ nationality: "French", gender: "M" });
  });
});

describe("headerHtml", () => {
  function richCv() {
    return updateOwner(emptyCv(), {
      headline: "Assistant Professor",
      summary: "Researcher in pharmacovigilance.",
      photo: PNG,
      contact: { email: "a@b.com", location: "Nagoya", website: "https://me.org" },
      links: [{ label: "Scholar", url: "https://scholar.example/me" }],
    });
  }

  it("renders headline, contact, links and summary", () => {
    const html = headerHtml(richCv());
    expect(html).toContain("Assistant Professor");
    expect(html).toContain("Nagoya");
    expect(html).toContain('href="mailto:a@b.com"');
    expect(html).toContain('href="https://me.org"');
    expect(html).toContain("Scholar");
    expect(html).toContain("Researcher in pharmacovigilance.");
  });

  it("includes the photo only when the template opts in", () => {
    expect(headerHtml(richCv(), { photo: true })).toContain('<img class="cv-photo"');
    expect(headerHtml(richCv())).not.toContain("cv-photo");
  });

  it("sanitizes a malicious link (no javascript: href)", () => {
    const cv = updateOwner(emptyCv(), {
      contact: { website: "javascript:alert(1)" },
      links: [{ label: "x", url: "javascript:alert(2)" }],
    });
    const html = headerHtml(cv);
    expect(html).not.toContain("javascript:");
  });
});
