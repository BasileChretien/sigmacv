import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { signpostingLinkHeader } from "@/lib/cv/signposting";
import type { CanonicalCv } from "@/lib/canonical/schema";

interface MakeOpts {
  orcid?: string;
  authorIds?: string[];
  cvLicense?: CanonicalCv["display"]["cvLicense"];
}

/** Minimal CanonicalCv whose owner identifiers + license we control. */
function makeCv(opts: MakeOpts = {}): CanonicalCv {
  let cv = buildCanonicalCv({
    id: "j",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  cv = {
    ...cv,
    owner: {
      ...cv.owner,
      orcid: opts.orcid ?? cv.owner.orcid,
      openAlexAuthorIds: opts.authorIds ?? cv.owner.openAlexAuthorIds,
    },
  };
  if (opts.cvLicense) cv = updateDisplay(cv, { cvLicense: opts.cvLicense });
  return cv;
}

/** Split a Link header value into its individual link-value strings. */
function linkValues(header: string): string[] {
  return header.split(/,\s*(?=<)/);
}

describe("signpostingLinkHeader", () => {
  it("emits the FAIR Signposting typed links for a full profile", () => {
    const header = signpostingLinkHeader(makeCv({ cvLicense: "CC-BY-4.0" }), "basile-x7");

    // Resource type.
    expect(header).toContain('<https://schema.org/ProfilePage>; rel="type"');
    // Author persistent identifiers (ORCID + OpenAlex).
    expect(header).toContain('<https://orcid.org/0000-0002-7483-2489>; rel="author"');
    expect(header).toContain('<https://openalex.org/A5001069481>; rel="author"');
    // Typed machine representations, each with its media type.
    expect(header).toContain('/p/basile-x7.jsonld>; rel="describedby"; type="application/ld+json"');
    expect(header).toContain(
      '/p/basile-x7.csl.json>; rel="describedby"; type="application/vnd.citationstyles.csl+json"',
    );
    expect(header).toContain('/p/basile-x7.bib>; rel="describedby"; type="application/x-bibtex"');
    expect(header).toContain('/p/basile-x7.json>; rel="describedby"; type="application/json"');
    // Reuse license (SPDX URL) when the owner chose a linkable one.
    expect(header).toContain('<https://spdx.org/licenses/CC-BY-4.0.html>; rel="license"');
  });

  it("uses absolute URLs for the machine representations", () => {
    const header = signpostingLinkHeader(makeCv(), "slug-1");
    expect(header).toContain("<https://sigmacv.org/p/slug-1.jsonld>");
    expect(header).toContain("<https://sigmacv.org/p/slug-1.bib>");
  });

  it("omits the license link when the CV has no linkable license (default 'none')", () => {
    const header = signpostingLinkHeader(makeCv(), "slug-1");
    expect(header).not.toContain('rel="license"');
  });

  it("omits an empty or malformed ORCID, keeping the other links", () => {
    const empty = signpostingLinkHeader(makeCv({ orcid: "" }), "slug-1");
    expect(empty).not.toContain("orcid.org");
    expect(empty).toContain('rel="type"');

    const malformed = signpostingLinkHeader(makeCv({ orcid: "not-an-orcid" }), "slug-1");
    expect(malformed).not.toContain("orcid.org");
  });

  it("normalizes an OpenAlex author id given as a full URL", () => {
    const header = signpostingLinkHeader(
      makeCv({ authorIds: ["https://openalex.org/A777"] }),
      "slug-1",
    );
    expect(header).toContain('<https://openalex.org/A777>; rel="author"');
  });

  it("drops malformed OpenAlex ids and de-duplicates valid ones", () => {
    const header = signpostingLinkHeader(
      makeCv({ authorIds: ["A123", "A123", "bogus", "  ", "A123/works"] }),
      "slug-1",
    );
    const authorLinks = linkValues(header).filter((l) => l.includes("openalex.org"));
    expect(authorLinks).toEqual(['<https://openalex.org/A123>; rel="author"']);
  });

  it("produces no author links when the owner has no valid identifiers", () => {
    const header = signpostingLinkHeader(makeCv({ orcid: "", authorIds: [] }), "slug-1");
    expect(header).not.toContain('rel="author"');
    // The type + the four describedby links are still present.
    expect(linkValues(header)).toHaveLength(5);
  });
});
