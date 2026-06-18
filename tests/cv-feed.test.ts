import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { renderCvAtomFeed } from "@/lib/cv/feed";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Ada & Co",
};

function work(id: string, year: number, opts: { doi?: string; title?: string } = {}): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    doi: opts.doi ? `https://doi.org/${opts.doi}` : undefined,
    title: opts.title ?? `Study ${id}`,
    display_name: opts.title ?? `Study ${id}`,
    type: "article",
    publication_year: year,
    publication_date: `${year}-03-04`,
    authorships: [{ author: { id: SELF, display_name: "Ada" }, raw_author_name: "Ada" }],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "feed",
    resolved,
    works: [
      work("W1", 2024, { doi: "10.1/abc", title: "Cancer & immunity" }),
      work("W2", 2022, {}),
    ],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("renderCvAtomFeed", () => {
  const xml = renderCvAtomFeed(makeCv(), "ada-x7", "https://sigmacv.org/");

  it("is a well-formed Atom feed with self + alternate links", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain(
      '<link rel="self" type="application/atom+xml" href="https://sigmacv.org/p/ada-x7/feed.xml"/>',
    );
    expect(xml).toContain(
      '<link rel="alternate" type="text/html" href="https://sigmacv.org/p/ada-x7"/>',
    );
    // The owner name is XML-escaped in the title + author.
    expect(xml).toContain("<title>Ada &amp; Co</title>");
  });

  it("emits one entry per work, newest first, with escaped titles", () => {
    const first = xml.indexOf("Cancer &amp; immunity");
    const second = xml.indexOf("Study W2");
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second); // 2024 entry precedes 2022 entry
  });

  it("links a DOI work to doi.org with a DOI id, and a DOI-less work to a urn id", () => {
    expect(xml).toContain('<link rel="alternate" href="https://doi.org/10.1/abc"/>');
    expect(xml).toContain("<id>https://doi.org/10.1/abc</id>");
    expect(xml).toContain("<id>urn:sigmacv:ada-x7:W2</id>");
    // Issued date drives the entry timestamp (RFC3339).
    expect(xml).toContain("<updated>2024-03-04T00:00:00Z</updated>");
  });

  it("produces a valid empty feed when there are no works", () => {
    const empty = buildCanonicalCv({
      id: "e",
      resolved,
      works: [],
      now: "2026-06-02T00:00:00.000Z",
    });
    const out = renderCvAtomFeed(empty, "x", "https://sigmacv.org");
    expect(out).toContain("<feed");
    expect(out).not.toContain("<entry>");
  });
});
