import { describe, expect, it } from "vitest";
import { coinsTitle, coinsSpan } from "@/lib/render/coins";
import type { CslItem } from "@/types/csl";

const csl = (over: Partial<CslItem> = {}): CslItem => ({
  id: "W1",
  type: "article-journal",
  title: "A study of things",
  author: [{ family: "Chrétien", given: "Basile" }, { literal: "WHO Group" }],
  issued: { "date-parts": [[2024, 5, 1]] },
  "container-title": "Journal of Things",
  volume: "3",
  issue: "2",
  page: "10-20",
  DOI: "10.1/abc",
  ISSN: ["1234-5678"],
  ...over,
});

describe("coinsTitle (OpenURL KEV)", () => {
  it("encodes the core journal-article fields", () => {
    const t = coinsTitle(csl());
    expect(t).toContain("ctx_ver=Z39.88-2004");
    expect(t).toContain("rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal");
    expect(t).toContain("rft.atitle=A%20study%20of%20things");
    expect(t).toContain("rft.jtitle=Journal%20of%20Things");
    expect(t).toContain("rft.volume=3");
    expect(t).toContain("rft.issue=2");
    expect(t).toContain("rft.spage=10");
    expect(t).toContain("rft.epage=20");
    expect(t).toContain("rft.date=2024");
    expect(t).toContain("rft.issn=1234-5678");
    expect(t).toContain("rft_id=info%3Adoi%2F10.1%2Fabc");
  });

  it("emits one rft.au per author (family-given + literal)", () => {
    const aus = coinsTitle(csl())
      .split("&")
      .filter((p) => p.startsWith("rft.au="));
    expect(aus).toEqual(["rft.au=Chr%C3%A9tien%2C%20Basile", "rft.au=WHO%20Group"]);
  });

  it("handles family-only / given-only / empty author names", () => {
    expect(coinsTitle(csl({ author: [{ family: "Curie" }] }))).toContain("rft.au=Curie");
    expect(coinsTitle(csl({ author: [{ given: "Plato" }] }))).toContain("rft.au=Plato");
    const noAu = coinsTitle(csl({ author: [{}] }))
      .split("&")
      .filter((p) => p.startsWith("rft.au="));
    expect(noAu).toEqual([]); // an empty author contributes no rft.au
  });

  it("uses spage only for a single page and omits empty fields / DOI", () => {
    const t = coinsTitle({ id: "X", type: "article-journal", title: "T", page: "42" });
    expect(t).toContain("rft.spage=42");
    expect(t).not.toContain("rft.epage=");
    expect(t).not.toContain("rft.jtitle=");
    expect(t).not.toContain("rft_id=");
    expect(t).not.toContain("rft.au=");
  });
});

describe("coinsSpan", () => {
  it("wraps the KEV in an invisible Z3988 span, HTML-escaping the & separators", () => {
    const span = coinsSpan(csl());
    expect(span.startsWith('<span class="Z3988" title="')).toBe(true);
    expect(span.endsWith('"></span>')).toBe(true);
    // The "&" KEV separators are escaped in the attribute (the parser restores them).
    expect(span).toContain("&amp;rft.atitle=");
  });
});
