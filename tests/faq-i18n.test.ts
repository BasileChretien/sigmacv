import { describe, expect, it } from "vitest";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { faqStrings } from "@/lib/i18n/faq";

describe("faqStrings", () => {
  it("localizes the FAQ page and falls back to English", () => {
    expect(faqStrings("en-US").heading).toBe("Frequently asked questions");
    expect(faqStrings("fr-FR").heading).toBe("Questions fréquentes");
    expect(faqStrings("ja-JP").metaTitle).toBe("よくある質問");
    expect(faqStrings("xx-XX").heading).toBe(faqStrings("en-US").heading);
  });

  it("has every scalar field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { items, ...scalars } = faqStrings(loc);
      for (const value of Object.values(scalars)) {
        expect(value.length).toBeGreaterThan(0);
      }
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 6 items with non-empty q/a in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { items } = faqStrings(loc);
      expect(items).toHaveLength(6);
      for (const item of items) {
        expect(item.q.length).toBeGreaterThan(0);
        expect(item.a.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps brand/proper nouns in the data-source answer", () => {
    for (const loc of SUPPORTED_LOCALES) {
      // The 3rd item (index 2) is the "where does the data come from?" answer.
      const dataItem = faqStrings(loc).items[2];
      expect(dataItem).toBeDefined();
      const dataAnswer = dataItem?.a ?? "";
      expect(dataAnswer).toContain("OpenAlex");
      expect(dataAnswer).toContain("ORCID");
      expect(dataAnswer).toContain("Crossref");
      expect(dataAnswer).toContain("DataCite");
      expect(dataAnswer).toContain("Open Editors Plus");
    }
  });
});

describe("faqPageJsonLd", () => {
  it("emits a FAQPage with every question and escapes raw <", () => {
    const items = faqStrings("en-US").items;
    const html = faqPageJsonLd(items);

    expect(html).toContain('"@type":"FAQPage"');
    for (const item of items) {
      expect(html).toContain(JSON.stringify(item.q).slice(1, -1));
    }

    // The outer wrapper <script> tag is expected; the JSON payload itself must
    // have any "<" escaped to "<" so it can't break out of the element.
    const payload = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(payload).not.toContain("<");
    expect(html).toContain("<script");
    expect(html).toContain("</script>");
  });

  it("escapes a < embedded inside an answer", () => {
    const html = faqPageJsonLd([{ q: "Q", a: "a < b </script>" }]);
    const payload = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(payload).not.toContain("<");
    expect(payload).toContain("\\u003c");
  });
});
