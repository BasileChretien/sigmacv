import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { publicMetaDescription, publicMetaTags } from "@/lib/cv/publicMeta";
import type { CanonicalCv } from "@/lib/canonical/schema";

function makeCv(owner: Partial<CanonicalCv["owner"]> = {}): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "m",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  return { ...cv, owner: { ...cv.owner, ...owner } };
}

describe("publicMetaDescription", () => {
  it("joins headline + summary", () => {
    const d = publicMetaDescription(makeCv({ headline: "Researcher", summary: "I study ADRs." }));
    expect(d).toBe("Researcher — I study ADRs.");
  });

  it("returns '' when neither headline nor summary is set", () => {
    expect(publicMetaDescription(makeCv())).toBe("");
  });

  it("collapses whitespace", () => {
    expect(publicMetaDescription(makeCv({ headline: "  a\n  b  " }))).toBe("a b");
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
    const html = publicMetaTags(makeCv({ headline: "Researcher" }));
    expect(html).toContain('property="og:type" content="profile"');
    expect(html).toContain('property="og:title" content="Basile Chrétien"');
    expect(html).toContain('property="og:description" content="Researcher"');
    expect(html).toContain('name="twitter:card" content="summary"');
  });

  it("omits the description tags when there is no headline/summary", () => {
    const html = publicMetaTags(makeCv());
    expect(html).not.toContain("og:description");
    expect(html).not.toContain("twitter:description");
    // title still present, falling back when displayName is set it uses the name.
    expect(html).toContain('content="Basile Chrétien"');
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
});
