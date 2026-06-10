import { describe, expect, it } from "vitest";
import { GUIDE_SLUGS } from "@/lib/guides/guides";
import { GLOSSARY_SLUGS, getTerm, listTerms } from "@/lib/glossary/glossary";
import {
  definedTermJsonLd,
  definedTermSetJsonLd,
  glossaryIndexBreadcrumbJsonLd,
  glossaryTermBreadcrumbJsonLd,
} from "@/lib/glossary/jsonLd";
import { GLOSSARY_NAV_LABEL, glossaryNavLabel } from "@/lib/i18n/guidesNav";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { LANDING_PAGE_IDS } from "@/lib/i18n/landingPages";

describe("glossary content", () => {
  const terms = listTerms();

  it("has several terms with unique slugs, alphabetical by name", () => {
    expect(terms.length).toBeGreaterThanOrEqual(5);
    expect(new Set(GLOSSARY_SLUGS).size).toBe(GLOSSARY_SLUGS.length);
    expect(GLOSSARY_SLUGS).toContain("orcid");
    const names = terms.map((t) => t.term);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("every term is well-formed with resolvable cross-links", () => {
    for (const t of terms) {
      for (const v of [t.term, t.title, t.short, t.description]) {
        expect(v.length).toBeGreaterThan(0);
      }
      expect(t.blocks.length).toBeGreaterThan(0);
      for (const b of t.blocks) {
        if (b.type === "h2") expect(b.id.length).toBeGreaterThan(0);
        if (b.type === "cta") {
          expect(b.href.length).toBeGreaterThan(0);
          expect(b.label.length).toBeGreaterThan(0);
        }
        if (b.type === "ul" || b.type === "ol") expect(b.items.length).toBeGreaterThan(0);
      }
      for (const f of t.faq ?? []) {
        expect(f.q.length).toBeGreaterThan(0);
        expect(f.a.length).toBeGreaterThan(0);
      }
      for (const slug of t.relatedTerms ?? []) {
        expect(GLOSSARY_SLUGS).toContain(slug);
        expect(slug).not.toBe(t.slug);
      }
      for (const id of t.relatedPages ?? []) expect(LANDING_PAGE_IDS).toContain(id);
      for (const slug of t.relatedGuides ?? []) expect(GUIDE_SLUGS).toContain(slug);
    }
  });

  it("getTerm resolves known slugs and rejects unknown", () => {
    expect(getTerm("orcid")?.term).toBe("ORCID");
    expect(getTerm("nope")).toBeUndefined();
  });
});

describe("glossary JSON-LD", () => {
  const term = getTerm("orcid")!;

  it("builds a DefinedTerm inside the term set", () => {
    const ld = definedTermJsonLd(term);
    expect(ld).toContain('"@type":"DefinedTerm"');
    expect(ld).toContain('"name":"ORCID"');
    expect(ld).toContain('"inDefinedTermSet"');
    expect(ld).toContain("/glossary/orcid");
  });

  it("builds breadcrumbs (3-level term, 2-level index)", () => {
    expect(glossaryTermBreadcrumbJsonLd(term)).toContain('"position":3');
    expect(glossaryIndexBreadcrumbJsonLd()).not.toContain('"position":3');
    expect(glossaryIndexBreadcrumbJsonLd()).toContain('"position":2');
  });

  it("builds a DefinedTermSet listing every term", () => {
    const ld = definedTermSetJsonLd(listTerms());
    expect(ld).toContain('"@type":"DefinedTermSet"');
    for (const t of listTerms()) expect(ld).toContain(`/glossary/${t.slug}`);
  });
});

describe("glossaryNavLabel", () => {
  it("is defined non-empty for all 10 locales and falls back to English", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(GLOSSARY_NAV_LABEL[loc].length).toBeGreaterThan(0);
      expect(glossaryNavLabel(loc)).toBe(GLOSSARY_NAV_LABEL[loc]);
    }
    expect(glossaryNavLabel("xx-XX")).toBe(GLOSSARY_NAV_LABEL["en-US"]);
  });
});
