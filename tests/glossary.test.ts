import { describe, expect, it } from "vitest";
import { type GlossaryTerm, GLOSSARY_SLUGS, getTerm, listTerms } from "@/lib/glossary/glossary";
import {
  definedTermJsonLd,
  definedTermSetJsonLd,
  glossaryIndexBreadcrumbJsonLd,
  glossaryTermBreadcrumbJsonLd,
} from "@/lib/glossary/jsonLd";
import type { GuideBlock } from "@/lib/guides/guides";
import { GUIDE_SLUGS } from "@/lib/guides/guides";
import { localeLanguageCode, SUPPORTED_LOCALES } from "@/lib/i18n";
import { GLOSSARY_NAV_LABEL, glossaryNavLabel } from "@/lib/i18n/guidesNav";
import { LANDING_PAGE_IDS } from "@/lib/i18n/landingPages";

function structure(blocks: GuideBlock[]): string[] {
  return blocks.map((b) => {
    if (b.type === "h2") return `h2#${b.id}`;
    if (b.type === "cta") return `cta>${b.href}`;
    if (b.type === "ul" || b.type === "ol") return `${b.type}:${b.items.length}`;
    return b.type;
  });
}

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

describe("glossary localization (forced 10 locales)", () => {
  const en = Object.fromEntries(listTerms("en-US").map((t) => [t.slug, t]));

  it("every locale defines every term with identical structure", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const terms = listTerms(loc);
      expect(terms.map((t) => t.slug).sort()).toEqual([...GLOSSARY_SLUGS].sort());
      for (const t of terms) {
        const ref = en[t.slug]!;
        expect(structure(t.blocks)).toEqual(structure(ref.blocks));
        expect(t.faq?.length ?? 0).toBe(ref.faq?.length ?? 0);
        expect(t.relatedTerms).toEqual(ref.relatedTerms);
        for (const v of [t.term, t.title, t.short, t.description]) {
          expect(v.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("non-English locales actually differ from English", () => {
    expect(getTerm("orcid", "fr-FR")!.title).not.toBe(getTerm("orcid", "en-US")!.title);
  });

  it("unknown locale falls back to English", () => {
    expect(getTerm("orcid", "xx-XX")!.title).toBe(getTerm("orcid", "en-US")!.title);
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
    expect(ld).toContain('"inLanguage":"en"');
  });

  it("localizes inLanguage + URL per locale", () => {
    const fr = definedTermJsonLd(getTerm("orcid", "fr-FR")!, "fr-FR");
    expect(fr).toContain(`"inLanguage":"${localeLanguageCode("fr-FR")}"`);
    expect(fr).toContain("/fr/glossary/orcid");
    const crumb = glossaryTermBreadcrumbJsonLd(getTerm("orcid", "fr-FR")!, "fr-FR");
    expect(crumb).toContain(glossaryNavLabel("fr-FR"));
    expect(crumb).toContain("/fr/glossary/orcid");
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
    // Localized set uses locale-prefixed URLs.
    expect(definedTermSetJsonLd(listTerms("fr-FR"), "fr-FR")).toContain("/fr/glossary/orcid");
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

const _typecheck: GlossaryTerm | undefined = getTerm("orcid");
void _typecheck;
