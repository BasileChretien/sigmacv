import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setItemNotMine, updateDisplay, updateOwner } from "@/lib/canonical/curate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import {
  chooseFormatFromAccept,
  formatFromSlug,
  publicCslItems,
  serializePublicCv,
} from "@/lib/cv/publicFormats";
import { cvCslItems } from "@/lib/render/csljson";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { CanonicalCv } from "@/lib/canonical/schema";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function baseCv(): CanonicalCv {
  return buildCanonicalCv({ id: "pf", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

/** A public-projected CV with contact opted OUT (the default). */
function publicCv(): CanonicalCv {
  const cv = updateOwner(baseCv(), {
    contact: { email: "secret@example.org", phone: "+81-90", website: "https://example.org" },
  });
  return projectCvForPublic(cv);
}

describe("chooseFormatFromAccept", () => {
  it("defaults to html when the header is absent/empty", () => {
    expect(chooseFormatFromAccept(null)).toBe("html");
    expect(chooseFormatFromAccept(undefined)).toBe("html");
    expect(chooseFormatFromAccept("")).toBe("html");
  });

  it("maps the known machine media types", () => {
    expect(chooseFormatFromAccept("application/ld+json")).toBe("jsonld");
    expect(chooseFormatFromAccept("application/vnd.citationstyles.csl+json")).toBe("csljson");
    expect(chooseFormatFromAccept("application/x-bibtex")).toBe("bibtex");
    expect(chooseFormatFromAccept("text/x-bibtex")).toBe("bibtex");
    expect(chooseFormatFromAccept("application/json")).toBe("json");
  });

  it("falls back to html for a browser Accept (text/html, */*)", () => {
    expect(
      chooseFormatFromAccept("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
    ).toBe("html");
  });

  it("respects q-values (a higher-q machine type wins over a lower-q one)", () => {
    expect(chooseFormatFromAccept("application/json;q=0.3, application/x-bibtex;q=0.9")).toBe(
      "bibtex",
    );
    // Reversed weights flip the winner.
    expect(chooseFormatFromAccept("application/json;q=0.9, application/x-bibtex;q=0.3")).toBe(
      "json",
    );
  });

  it("treats q=0 as a rejection and ignores unknown types", () => {
    expect(chooseFormatFromAccept("application/json;q=0")).toBe("html");
    expect(chooseFormatFromAccept("application/unknown, text/plain")).toBe("html");
  });

  it("breaks q ties by header order", () => {
    expect(chooseFormatFromAccept("application/json, application/x-bibtex")).toBe("json");
  });
});

describe("formatFromSlug", () => {
  it("returns null for a plain slug", () => {
    expect(formatFromSlug("alice-x7")).toBeNull();
  });

  it("detects each suffix and strips it", () => {
    expect(formatFromSlug("alice-x7.json")).toEqual({ slug: "alice-x7", format: "json" });
    expect(formatFromSlug("alice-x7.bib")).toEqual({ slug: "alice-x7", format: "bibtex" });
    expect(formatFromSlug("alice-x7.jsonld")).toEqual({ slug: "alice-x7", format: "jsonld" });
  });

  it("matches .csl.json before .json (longest suffix wins)", () => {
    expect(formatFromSlug("alice-x7.csl.json")).toEqual({ slug: "alice-x7", format: "csljson" });
  });

  it("is case-insensitive on the extension but preserves the slug case", () => {
    expect(formatFromSlug("Alice-X7.JSON")).toEqual({ slug: "Alice-X7", format: "json" });
  });

  it("does not strip when the whole slug IS the suffix (no real slug left)", () => {
    expect(formatFromSlug(".json")).toBeNull();
  });
});

describe("publicCslItems", () => {
  it("returns only visible, owned, not-not-mine citation items", () => {
    const items = publicCslItems(publicCv());
    expect(items.length).toBeGreaterThan(0);
    items.forEach((csl) => expect(csl.id).toBeTruthy());
  });

  it("excludes hidden and 'not mine' items", () => {
    let cv = baseCv();
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    const before = publicCslItems(projectCvForPublic(cv)).length;
    const first = pubs.items[0]!;
    const second = pubs.items[1]!;
    cv = setItemIncluded(cv, pubs.id, first.id, false);
    cv = setItemNotMine(cv, pubs.id, second.id, true, { now: "2026-06-02T00:00:00.000Z" });
    const after = publicCslItems(projectCvForPublic(cv)).length;
    expect(after).toBe(before - 2);
  });

  it("is the SAME predicate as render/csljson cvCslItems (single shared source)", () => {
    // Fix 9: publicCslItems is a thin alias of cvCslItems — they must never
    // diverge. Identical output on the same CV proves they share one definition.
    const cv = publicCv();
    expect(publicCslItems(cv)).toEqual(cvCslItems(cv));
  });
});

describe("serializePublicCv", () => {
  it("jsonld → parseable application/ld+json ProfilePage", () => {
    const out = serializePublicCv(publicCv(), "jsonld", "slug-1");
    expect(out.contentType).toContain("application/ld+json");
    expect(out.extension).toBe("jsonld");
    const parsed = JSON.parse(out.body);
    expect(parsed["@type"]).toBe("ProfilePage");
    expect(parsed.url).toContain("/p/slug-1");
  });

  it("json → the public-projected canonical object, parseable", () => {
    const out = serializePublicCv(publicCv(), "json", "s");
    expect(out.contentType).toContain("application/json");
    expect(out.extension).toBe("json");
    const parsed = JSON.parse(out.body) as CanonicalCv;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.owner.orcid).toBe("0000-0002-7483-2489");
  });

  it("csljson → a JSON array of CSL items", () => {
    const out = serializePublicCv(publicCv(), "csljson", "s");
    expect(out.contentType).toContain("application/vnd.citationstyles.csl+json");
    expect(out.extension).toBe("csl.json");
    const parsed = JSON.parse(out.body);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(publicCslItems(publicCv()).length);
  });

  it("bibtex → an @entry document, application/x-bibtex", () => {
    const out = serializePublicCv(publicCv(), "bibtex", "s");
    expect(out.contentType).toContain("application/x-bibtex");
    expect(out.extension).toBe("bib");
    expect(out.body).toContain("@");
  });

  it("never leaks personal/contact-gated data into json/csljson/bibtex", () => {
    // The owner's private email is set but NOT opted in for public display.
    const cv = publicCv();
    expect(cv.owner.contact?.email).toBeUndefined(); // projection already stripped it
    for (const fmt of ["json", "csljson", "bibtex"] as const) {
      const body = serializePublicCv(cv, fmt, "s").body;
      expect(body).not.toContain("secret@example.org");
      expect(body).not.toContain("+81-90");
    }
  });

  it("exposes opted-in contact only when the owner consented", () => {
    let cv = updateOwner(baseCv(), {
      contact: { email: "shown@example.org" },
    });
    cv = updateDisplay(cv, { publicContact: { email: true, phone: false, location: false } });
    const projected = projectCvForPublic(cv);
    const body = serializePublicCv(projected, "json", "s").body;
    expect(body).toContain("shown@example.org");
  });
});
