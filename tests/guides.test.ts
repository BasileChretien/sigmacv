import { describe, expect, it } from "vitest";
import {
  GUIDE_SLUGS,
  getGuide,
  guideReadingMinutes,
  guideWordCount,
  listGuides,
} from "@/lib/guides/guides";
import {
  guideArticleJsonLd,
  guideBreadcrumbJsonLd,
  guidesIndexBreadcrumbJsonLd,
  guidesItemListJsonLd,
} from "@/lib/guides/jsonLd";
import { guidesNavLabel, GUIDES_NAV_LABEL } from "@/lib/i18n/guidesNav";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { LANDING_PAGE_IDS } from "@/lib/i18n/landingPages";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("guides content", () => {
  const guides = listGuides();

  it("has at least two guides with unique slugs", () => {
    expect(guides.length).toBeGreaterThanOrEqual(2);
    expect(new Set(GUIDE_SLUGS).size).toBe(GUIDE_SLUGS.length);
    expect(GUIDE_SLUGS).toContain("how-to-write-an-academic-cv");
  });

  it("lists guides newest-first", () => {
    const dates = guides.map((g) => g.datePublished);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("every guide is well-formed", () => {
    for (const g of guides) {
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.description.length).toBeGreaterThan(0);
      expect(g.blocks.length).toBeGreaterThan(0);
      expect(g.datePublished).toMatch(ISO_DATE);
      expect(g.dateModified).toMatch(ISO_DATE);
      expect(g.dateModified >= g.datePublished).toBe(true);
      // Headings carry ids (anchors); cta carry href+label.
      for (const b of g.blocks) {
        if (b.type === "h2") expect(b.id.length).toBeGreaterThan(0);
        if (b.type === "cta") {
          expect(b.href.length).toBeGreaterThan(0);
          expect(b.label.length).toBeGreaterThan(0);
        }
        if (b.type === "ul" || b.type === "ol") expect(b.items.length).toBeGreaterThan(0);
      }
      for (const f of g.faq ?? []) {
        expect(f.q.length).toBeGreaterThan(0);
        expect(f.a.length).toBeGreaterThan(0);
      }
      // Cross-links resolve to real targets.
      for (const slug of g.relatedGuides ?? []) {
        expect(GUIDE_SLUGS).toContain(slug);
        expect(slug).not.toBe(g.slug);
      }
      for (const id of g.relatedPages ?? []) {
        expect(LANDING_PAGE_IDS).toContain(id);
      }
      expect(guideReadingMinutes(g)).toBeGreaterThanOrEqual(1);
      expect(guideWordCount(g)).toBeGreaterThan(0);
    }
  });

  it("getGuide resolves known slugs and rejects unknown", () => {
    expect(getGuide("how-to-write-an-academic-cv")?.slug).toBe("how-to-write-an-academic-cv");
    expect(getGuide("does-not-exist")).toBeUndefined();
  });
});

describe("guides JSON-LD", () => {
  const guide = getGuide("how-to-write-an-academic-cv")!;

  it("builds Article JSON-LD with author, dates and language", () => {
    const ld = guideArticleJsonLd(guide);
    expect(ld).toContain('"@type":"Article"');
    expect(ld).toContain('"headline"');
    expect(ld).toContain("Basile Chr"); // author present
    expect(ld).toContain("orcid.org/0000-0002-7483-2489");
    expect(ld).toContain(`"datePublished":"${guide.datePublished}"`);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).toContain("/guides/how-to-write-an-academic-cv");
  });

  it("builds a 3-level breadcrumb for a guide and 2-level for the index", () => {
    const crumb = guideBreadcrumbJsonLd(guide);
    expect(crumb).toContain('"@type":"BreadcrumbList"');
    expect(crumb).toContain('"position":3');
    expect(guidesIndexBreadcrumbJsonLd()).not.toContain('"position":3');
    expect(guidesIndexBreadcrumbJsonLd()).toContain('"position":2');
  });

  it("builds an ItemList of all guides for the index", () => {
    const list = guidesItemListJsonLd(listGuides());
    expect(list).toContain('"@type":"ItemList"');
    for (const g of listGuides()) {
      expect(list).toContain(`/guides/${g.slug}`);
    }
  });
});

describe("guidesNavLabel", () => {
  it("is defined non-empty for all 10 locales and falls back to English", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      expect(GUIDES_NAV_LABEL[loc].length).toBeGreaterThan(0);
      expect(guidesNavLabel(loc)).toBe(GUIDES_NAV_LABEL[loc]);
    }
    expect(guidesNavLabel("xx-XX")).toBe(GUIDES_NAV_LABEL["en-US"]);
  });
});
