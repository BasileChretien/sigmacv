import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";
import { itemDisplayText } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import { importJsonResume, parseJsonResume, type JsonResume } from "@/lib/import/jsonResume";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

/** A CV with an EMPTY profile (no name/contact/links) so fill-if-empty applies. */
function emptyProfileCv(): CanonicalCv {
  const base = buildCanonicalCv({ id: "jr", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
  return {
    ...base,
    owner: {
      ...base.owner,
      displayName: "",
      headline: undefined,
      summary: undefined,
      contact: undefined,
      links: [],
    },
  };
}

/** Text of every item in a section type, in order. */
function sectionTexts(cv: CanonicalCv, type: string): string[] {
  const section = cv.sections.find((s) => s.type === type);
  return (section?.items ?? []).map((it) => itemDisplayText(it) ?? "");
}

const FULL: JsonResume = {
  basics: {
    name: "Ada Lovelace",
    label: "Mathematician",
    email: "ada@example.org",
    phone: "+44 20 0000 0000",
    url: "https://ada.example.org",
    summary: "Pioneer of computing.",
    location: { city: "London", region: "England", countryCode: "GB" },
    profiles: [
      { network: "GitHub", url: "https://github.com/ada" },
      { network: "ORCID", url: "https://orcid.org/0000-0000-0000-0001" },
    ],
  },
  work: [
    { name: "Analytical Engine Co.", position: "Analyst", startDate: "1842", endDate: "1843" },
  ],
  volunteer: [{ organization: "Royal Society", position: "Contributor", startDate: "1840" }],
  education: [
    { institution: "Home tutoring", area: "Mathematics", studyType: "Self-study", endDate: "1835" },
  ],
  awards: [{ title: "Notes on the Engine", awarder: "Taylor's", date: "1843" }],
  skills: [{ name: "Algorithms", keywords: ["loops", "Bernoulli"] }],
  languages: [{ language: "English", fluency: "Native" }],
  projects: [{ name: "First program", description: "Bernoulli numbers" }],
  references: [{ name: "Charles Babbage", reference: "A brilliant collaborator." }],
};

describe("parseJsonResume", () => {
  it("parses a valid JSON résumé", () => {
    const res = parseJsonResume(JSON.stringify(FULL));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.resume.basics?.name).toBe("Ada Lovelace");
  });

  it("ignores unknown keys and accepts partial documents", () => {
    const res = parseJsonResume(JSON.stringify({ basics: { name: "X" }, meta: { theme: "y" } }));
    expect(res.ok).toBe(true);
  });

  it("rejects input larger than the cap", () => {
    const big = JSON.stringify({ basics: { summary: "x".repeat(1_000_001) } });
    const res = parseJsonResume(big);
    expect(res).toEqual({ ok: false, error: "too-large" });
  });

  it("rejects malformed JSON", () => {
    expect(parseJsonResume("{ not json ")).toEqual({ ok: false, error: "invalid-json" });
  });

  it("rejects JSON that is not a résumé object", () => {
    expect(parseJsonResume("42")).toEqual({ ok: false, error: "invalid-shape" });
    expect(parseJsonResume("[1,2,3]")).toEqual({ ok: false, error: "invalid-shape" });
  });
});

describe("importJsonResume", () => {
  it("fills empty profile fields and appends manual entries", () => {
    const cv = emptyProfileCv();
    const { cv: next, summary } = importJsonResume(cv, FULL, { idPrefix: "t" });

    // Profile filled from basics.
    expect(next.owner.displayName).toBe("Ada Lovelace");
    expect(next.owner.headline).toBe("Mathematician");
    expect(next.owner.summary).toBe("Pioneer of computing.");
    expect(next.owner.contact?.email).toBe("ada@example.org");
    expect(next.owner.contact?.phone).toBe("+44 20 0000 0000");
    expect(next.owner.contact?.website).toBe("https://ada.example.org");
    expect(next.owner.contact?.location).toBe("London, England, GB");
    expect(next.owner.links).toEqual([
      { label: "GitHub", url: "https://github.com/ada" },
      { label: "ORCID", url: "https://orcid.org/0000-0000-0000-0001" },
    ]);
    expect(new Set(summary.profileFilled)).toEqual(
      new Set([
        "displayName",
        "headline",
        "summary",
        "email",
        "phone",
        "website",
        "location",
        "links",
      ]),
    );

    // Entries appended with composed display text.
    expect(sectionTexts(next, "positions")).toEqual([
      "Analyst — Analytical Engine Co. (1842–1843)",
    ]);
    expect(sectionTexts(next, "service")).toEqual(["Contributor — Royal Society (1840)"]);
    expect(sectionTexts(next, "education")).toEqual([
      "Self-study Mathematics — Home tutoring (1835)",
    ]);
    expect(sectionTexts(next, "awards")).toEqual(["Notes on the Engine — Taylor's (1843)"]);
    expect(sectionTexts(next, "skills")).toEqual(["Algorithms: loops, Bernoulli"]);
    expect(sectionTexts(next, "languages")).toEqual(["English (Native)"]);
    expect(sectionTexts(next, "other")).toEqual(["First program — Bernoulli numbers"]);
    expect(sectionTexts(next, "references")).toEqual([
      "Charles Babbage: A brilliant collaborator.",
    ]);

    // Summary counts.
    expect(summary.total).toBe(8);
    expect(summary.counts.positions).toBe(1);
    expect(summary.counts.references).toBe(1);

    // The result is schema-valid and the input is untouched (immutable).
    expect(CanonicalCvSchema.safeParse(next).success).toBe(true);
    expect(cv.owner.displayName).toBe("");
    expect(cv.sections.some((s) => s.type === "positions")).toBe(false);
  });

  it("never overwrites existing profile values and dedupes links by URL", () => {
    const base = emptyProfileCv();
    const cv: CanonicalCv = {
      ...base,
      owner: {
        ...base.owner,
        displayName: "Existing Name",
        headline: "Existing headline",
        summary: "Existing summary",
        contact: { email: "keep@me.org" },
        links: [{ label: "Site", url: "https://github.com/ada/" }], // same host as a profile
      },
    };
    const { cv: next, summary } = importJsonResume(cv, FULL, { idPrefix: "t" });

    expect(next.owner.displayName).toBe("Existing Name");
    expect(next.owner.headline).toBe("Existing headline");
    expect(next.owner.summary).toBe("Existing summary");
    expect(next.owner.contact?.email).toBe("keep@me.org");
    // phone/website/location were empty → still filled.
    expect(next.owner.contact?.phone).toBe("+44 20 0000 0000");
    // GitHub link already present (trailing-slash difference) → not duplicated;
    // only the ORCID profile is appended.
    expect(next.owner.links).toEqual([
      { label: "Site", url: "https://github.com/ada/" },
      { label: "ORCID", url: "https://orcid.org/0000-0000-0000-0001" },
    ]);
    expect(summary.profileFilled).not.toContain("displayName");
    expect(summary.profileFilled).toContain("links");
  });

  it("skips blank entries and omits empty sections from the summary", () => {
    const cv = emptyProfileCv();
    const resume: JsonResume = {
      work: [{}, { position: "Real Job" }, { name: "   " }],
      // A non-empty array whose entries are ALL blank → no section is created.
      awards: [{}, { title: "   " }],
    };
    const { cv: next, summary } = importJsonResume(cv, resume, { idPrefix: "t" });
    expect(sectionTexts(next, "positions")).toEqual(["Real Job"]);
    expect(summary.counts.positions).toBe(1);
    expect(summary.counts.awards).toBeUndefined();
    expect(next.sections.some((s) => s.type === "awards")).toBe(false);
    expect(summary.total).toBe(1);
  });

  it("handles a résumé with no basics and no sections (nothing to import)", () => {
    const cv = emptyProfileCv();
    const { cv: next, summary } = importJsonResume(cv, {}, { idPrefix: "t" });
    expect(next).toBe(cv); // no profile change → same reference
    expect(summary).toEqual({ profileFilled: [], counts: {}, total: 0 });
  });

  it("formats partial dates, missing optional sub-fields, and country-only location", () => {
    const cv = emptyProfileCv();
    const resume: JsonResume = {
      basics: { location: { countryCode: "JP" } },
      work: [{ position: "Open-ended", startDate: "2020" }],
      education: [{ institution: "Uni", endDate: "2019" }],
      skills: [{ name: "Bare skill" }],
      languages: [{ language: "French" }],
      projects: [{ name: "Nameless desc only", description: "" }],
      references: [{ name: "Solo ref" }],
      awards: [{ title: "Untimed award" }],
    };
    const { cv: next } = importJsonResume(cv, resume, { idPrefix: "t" });
    expect(next.owner.contact?.location).toBe("JP");
    expect(sectionTexts(next, "positions")).toEqual(["Open-ended (2020)"]);
    expect(sectionTexts(next, "education")).toEqual(["Uni (2019)"]);
    expect(sectionTexts(next, "skills")).toEqual(["Bare skill"]);
    expect(sectionTexts(next, "languages")).toEqual(["French"]);
    expect(sectionTexts(next, "other")).toEqual(["Nameless desc only"]);
    expect(sectionTexts(next, "references")).toEqual(["Solo ref"]);
    expect(sectionTexts(next, "awards")).toEqual(["Untimed award"]);
  });

  it("generates collision-free ids across repeated imports", () => {
    let cv = emptyProfileCv();
    cv = importJsonResume(cv, FULL, { idPrefix: "a" }).cv;
    cv = importJsonResume(cv, FULL, { idPrefix: "b" }).cv;
    const positions = cv.sections.find((s) => s.type === "positions")!;
    expect(positions.items).toHaveLength(2);
    const ids = positions.items.map((it) => it.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("caps the number of entries imported per section", () => {
    const cv = emptyProfileCv();
    const work = Array.from({ length: 250 }, (_, i) => ({ position: `Role ${i}` }));
    const { cv: next, summary } = importJsonResume(cv, { work }, { idPrefix: "t" });
    expect(summary.counts.positions).toBe(200);
    expect(sectionTexts(next, "positions")).toHaveLength(200);
  });
});
