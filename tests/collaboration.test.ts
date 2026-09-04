import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { renderStrings } from "@/lib/i18n/render";
import { collaborationBreadth, collaborationHtml, countryName } from "@/lib/render/collaboration";
import { renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv, CvItem, CvSection, CvSectionType } from "@/lib/canonical/schema";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function base(): CanonicalCv {
  return buildCanonicalCv({ id: "CB", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
}

function work(id: string, countries?: string[], over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal" },
    meta: { countries, peerReviewed: true },
    ...over,
  } as CvItem;
}

function section(type: CvSectionType, items: CvItem[]): CvSection {
  return { id: type, type, title: type, visible: true, order: 0, items } as CvSection;
}

function cvWith(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
  return {
    ...updateDisplay(base(), { locale: "en-US", ...display }),
    sections: [section("publications", items)],
  };
}

describe("collaborationBreadth", () => {
  it("is undefined when no countable work carries country data", () => {
    expect(collaborationBreadth(base())).toBeUndefined();
    expect(collaborationBreadth(cvWith([work("a"), work("b", [])]))).toBeUndefined();
  });

  it("dedupes codes per work, counts distinct countries and the international share", () => {
    const b = collaborationBreadth(
      cvWith([
        work("a", ["JP", "jp", "FR"]), // 2 distinct → international
        work("b", ["JP"]), // domestic
        work("c", ["US", "JP", "DE", "FR"]), // international
        work("d"), // no data → not in the denominator
      ]),
    );
    expect(b).toBeDefined();
    expect(b!.works).toBe(3);
    expect(b!.countries).toBe(4);
    expect(b!.internationalShare).toBeCloseTo(2 / 3);
  });

  it("orders the top five by work count, ties alphabetical by code, and truncates", () => {
    const b = collaborationBreadth(
      cvWith([
        work("a", ["JP", "FR", "US", "DE", "IT", "ES", "GB"]),
        work("b", ["JP", "FR", "US"]),
        work("c", ["JP", "GB"]),
      ]),
    )!;
    expect(b.topCountries).toEqual([
      { code: "JP", works: 3 },
      { code: "FR", works: 2 },
      { code: "GB", works: 2 },
      { code: "US", works: 2 },
      { code: "DE", works: 1 },
    ]);
  });

  it("skips hidden, 'not mine', non-peer-reviewed and preprint works (countable only)", () => {
    const cv = {
      ...cvWith([
        work("a", ["JP"]),
        work("h", ["FR"], { included: false }),
        work("nm", ["FR"], { notMine: true }),
        work("np", ["FR"], { meta: { countries: ["FR"], peerReviewed: false } }),
      ]),
    };
    cv.sections.push(section("preprints", [work("pp", ["DE"])]));
    const b = collaborationBreadth(cv)!;
    expect(b.works).toBe(1);
    expect(b.countries).toBe(1);
    expect(b.internationalShare).toBe(0);
  });
});

describe("countryName", () => {
  it("localises a region code and falls back to the code", () => {
    expect(countryName("JP", "en-US")).toBe("Japan");
    expect(countryName("JP", "fr-FR")).toBe("Japon");
    expect(countryName("JP", "ja-JP")).toBe("日本");
    expect(countryName("AA", "en-US")).toBe("AA"); // user-assigned, no CLDR name → the code
    expect(countryName("1", "en-US")).toBe("1"); // invalid → DisplayNames throws → code
  });
});

describe("collaborationHtml", () => {
  const items = [
    work("a", ["JP", "FR"]),
    work("b", ["JP"]),
    work("c", ["JP", "US", "DE"]),
    work("d", ["FR"]),
  ];

  it("renders nothing when the toggle is off (the default) or there is no data", () => {
    expect(collaborationHtml(cvWith(items))).toBe("");
    expect(collaborationHtml(cvWith([work("x")], { showCollaboration: true }))).toBe("");
  });

  it("renders one line with the counts, the top countries and the basis", () => {
    const html = collaborationHtml(cvWith(items, { showCollaboration: true }));
    expect(html).toBe(
      '<p class="cv-collab"><span class="cv-collab-main">Co-authors from 4 countries · 50% of works international</span>' +
        ' <span class="cv-collab-top">— most often Japan, France, Germany, and United States</span>' +
        ' <span class="cv-metric-context">· based on OpenAlex affiliation data; n = 4</span></p>',
    );
  });

  it("uses the singular line for a single country", () => {
    const html = collaborationHtml(cvWith([work("a", ["JP"])], { showCollaboration: true }));
    expect(html).toContain("Co-authors from one country · 0% of works international");
    expect(html).toContain("most often Japan");
  });

  it("substitutes every placeholder in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = renderStrings(loc);
      expect(s.collabLine).toContain("{countries}");
      expect(s.collabLine).toContain("{pct}");
      expect(s.collabLineOne).toContain("{pct}");
      expect(s.collabTop).toContain("{list}");
      expect(s.collabContext).toContain("{n}");
      const html = collaborationHtml(cvWith(items, { showCollaboration: true, locale: loc }));
      expect(html).toContain('class="cv-collab"');
      expect(html).not.toMatch(/\{(countries|pct|list|n)\}/);
    }
  });

  it("sits in the research-summary block of the rendered document, after the output ledger", () => {
    const cv = cvWith(items, {
      showCollaboration: true,
      showOutputLedger: true,
      summaryBlockPosition: "header",
    });
    const html = renderCvHtml(cv);
    const ledgerAt = html.indexOf('class="cv-ledger"');
    const collabAt = html.indexOf('class="cv-collab"');
    const headerEnd = html.indexOf("</header>");
    expect(ledgerAt).toBeGreaterThan(-1);
    expect(collabAt).toBeGreaterThan(ledgerAt);
    expect(collabAt).toBeLessThan(headerEnd);
    // Off by default: the same document without the toggle carries no line.
    expect(renderCvHtml(cvWith(items, { showOutputLedger: true }))).not.toContain(
      'class="cv-collab"',
    );
    // The "hidden" placement suppresses it with the rest of the block.
    expect(
      renderCvHtml(cvWith(items, { showCollaboration: true, summaryBlockPosition: "hidden" })),
    ).not.toContain('class="cv-collab"');
  });
});
