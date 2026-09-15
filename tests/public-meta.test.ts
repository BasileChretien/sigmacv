import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { publicMetaDescription, publicMetaTags } from "@/lib/cv/publicMeta";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import type { OrcidPosition } from "@/lib/orcid/client";

function makeCv(
  owner: Partial<CanonicalCv["owner"]> = {},
  opts: { employments?: OrcidPosition[]; locale?: string } = {},
): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "m",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
    employments: opts.employments,
  });
  return {
    ...cv,
    owner: { ...cv.owner, ...owner },
    display: { ...cv.display, ...(opts.locale ? { locale: opts.locale } : {}) },
  };
}

const NAGOYA: OrcidPosition = {
  putCode: "200",
  organization: "Nagoya University",
  roleTitle: "Assistant Professor",
  startYear: 2024,
};

describe("publicMetaDescription", () => {
  it("joins headline + summary", () => {
    const d = publicMetaDescription(makeCv({ headline: "Researcher", summary: "I study ADRs." }));
    expect(d).toBe("Researcher — I study ADRs.");
  });

  it("falls back to name + latest affiliation when neither headline nor summary is set", () => {
    expect(publicMetaDescription(makeCv({}, { employments: [NAGOYA] }))).toBe(
      "Basile Chrétien, Assistant Professor, Nagoya University — academic CV on SigmaCV, built from open research data (ORCID, OpenAlex).",
    );
    // No position either: the name alone, still above a search engine's floor.
    const d = publicMetaDescription(makeCv());
    expect(d).toBe(
      "Basile Chrétien — academic CV on SigmaCV, built from open research data (ORCID, OpenAlex).",
    );
    expect(d.length).toBeGreaterThanOrEqual(25);
  });

  it("keeps a short headline but puts the name before it (a bare 'PharmD' was the live snippet)", () => {
    expect(publicMetaDescription(makeCv({ headline: "PharmD" }, { employments: [NAGOYA] }))).toBe(
      "Basile Chrétien, PharmD — academic CV on SigmaCV, built from open research data (ORCID, OpenAlex).",
    );
  });

  it("a headline of 25+ characters stands on its own, as before", () => {
    expect(publicMetaDescription(makeCv({ headline: "Clinical pharmacologist (PharmD)" }))).toBe(
      "Clinical pharmacologist (PharmD)",
    );
  });

  it("falls back in the CV's own locale, and to the tail alone when there is no name", () => {
    expect(publicMetaDescription(makeCv({}, { locale: "fr-FR" }))).toBe(
      "Basile Chrétien — CV académique sur SigmaCV, construit à partir de données de recherche ouvertes (ORCID, OpenAlex).",
    );
    const bare = publicMetaDescription(makeCv({ displayName: "" }));
    expect(bare).toBe("academic CV on SigmaCV, built from open research data (ORCID, OpenAlex).");
    for (const loc of SUPPORTED_LOCALES) {
      const d = publicMetaDescription(makeCv({ displayName: "" }, { locale: loc }));
      expect(d, loc).not.toContain("{who}");
      expect(d.length, loc).toBeGreaterThanOrEqual(25);
    }
  });

  it("collapses whitespace", () => {
    expect(
      publicMetaDescription(makeCv({ headline: "  a\n  b  ", summary: "c ".repeat(20) })),
    ).toBe(`a b — ${"c ".repeat(20).trim()}`);
  });

  it("truncates long text with an ellipsis", () => {
    const long = "word ".repeat(80).trim();
    const d = publicMetaDescription(makeCv({ summary: long }));
    expect(d.length).toBeLessThanOrEqual(200);
    expect(d.endsWith("…")).toBe(true);
  });

  it("truncates hard (no word boundary) when the first word is huge", () => {
    const d = publicMetaDescription(makeCv({ summary: "x".repeat(300) }));
    expect(d.length).toBeLessThanOrEqual(200);
    expect(d.endsWith("…")).toBe(true);
  });

  it("does not cut through a UTF-16 surrogate pair at the truncation boundary", () => {
    // 101 astral-plane characters (each = a surrogate pair → 2 code units, no
    // spaces) so the naive 199-unit cut would land between the two halves of a
    // pair. The fix backs off so the result has NO lone surrogate.
    const emoji = "😀"; // U+1F600, a single astral code point
    const d = publicMetaDescription(makeCv({ summary: emoji.repeat(101) }));
    expect(d.length).toBeLessThanOrEqual(200);
    expect(d.endsWith("…")).toBe(true);
    // No lone surrogate: every code unit before the ellipsis is part of a whole
    // pair. Stripping the ellipsis, the remaining text round-trips through
    // codePoint iteration without producing U+FFFD-style breakage.
    const body = d.slice(0, -1); // drop the ellipsis
    expect(body.length % 2).toBe(0); // whole emoji only → even unit count
    for (let i = 0; i < body.length; i++) {
      const code = body.charCodeAt(i);
      const isHigh = code >= 0xd800 && code <= 0xdbff;
      const isLow = code >= 0xdc00 && code <= 0xdfff;
      if (isHigh) {
        // A high surrogate must be immediately followed by a low surrogate.
        const next = body.charCodeAt(i + 1);
        expect(next >= 0xdc00 && next <= 0xdfff).toBe(true);
      }
      // The last unit must never be a lone high surrogate (the bug we fixed).
      if (i === body.length - 1) expect(isHigh).toBe(false);
      void isLow;
    }
  });
});

describe("publicMetaTags", () => {
  it("emits og:type=profile, og:title, twitter:card=summary", () => {
    const html = publicMetaTags(makeCv({ headline: "Researcher in pharmacology" }));
    expect(html).toContain('property="og:type" content="profile"');
    expect(html).toContain('property="og:title" content="Basile Chrétien"');
    expect(html).toContain('property="og:description" content="Researcher in pharmacology"');
    expect(html).toContain('name="twitter:card" content="summary"');
  });

  it("still emits the description tags when there is no headline/summary (the fallback line)", () => {
    const html = publicMetaTags(makeCv());
    expect(html).toContain('property="og:description" content="Basile Chrétien — academic CV');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('property="og:title" content="Basile Chrétien"');
  });

  it("falls back to a generic title when there is no display name", () => {
    const html = publicMetaTags(makeCv({ displayName: "" }));
    expect(html).toContain('property="og:title" content="Curriculum Vitae"');
  });

  it("escapes HTML in the title/description (no attribute breakout)", () => {
    const html = publicMetaTags(makeCv({ displayName: '"><script>', headline: "<b>x" }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;x");
  });

  it("references og:image and uses summary_large_image when an image URL is given", () => {
    const html = publicMetaTags(makeCv(), { imageUrl: "https://x/og.png" });
    expect(html).toContain('property="og:image" content="https://x/og.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("emits canonical, og:url and a standard description when a page URL is given", () => {
    const html = publicMetaTags(makeCv({ headline: "Researcher in pharmacology" }), {
      pageUrl: "https://sigmacv.org/p/abc",
    });
    expect(html).toContain('<link rel="canonical" href="https://sigmacv.org/p/abc" />');
    expect(html).toContain('property="og:url" content="https://sigmacv.org/p/abc"');
    expect(html).toContain('name="description" content="Researcher in pharmacology"');
  });

  it("omits canonical/og:url when no page URL is given", () => {
    const html = publicMetaTags(makeCv({ headline: "Researcher in pharmacology" }));
    expect(html).not.toContain("canonical");
    expect(html).not.toContain("og:url");
  });
});
