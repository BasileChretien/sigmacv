import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { PUBLIC_STYLES, type CanonicalCv } from "@/lib/canonical/schema";
import { publicStyleGalleryPreviews } from "@/lib/render/galleryPreview";
import { renderCvHtml } from "@/lib/render/html";
import { PUBLIC_STYLE_KEYS, getPublicStyle, renderPublicCvHtml } from "@/lib/render/publicStyles";
import { accentSpectrum } from "@/lib/render/publicStyles/kit";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const works = worksFixture as unknown as OpenAlexWork[];
// 1×1 transparent PNG — a valid owner.photo so the photo path is exercised.
const PNG_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const base = buildCanonicalCv({ id: "ps", resolved, works, now: "2026-06-02T00:00:00.000Z" });
const withPhoto: CanonicalCv = { ...base, owner: { ...base.owner, photo: PNG_1x1 } };

describe("public-page showcase styles", () => {
  it("registers all 13 animated styles", () => {
    expect(PUBLIC_STYLE_KEYS).toHaveLength(13);
    expect(PUBLIC_STYLE_KEYS).toEqual(
      expect.arrayContaining([
        "folio",
        "meridian",
        "trajectory",
        "lumina",
        "prism",
        "pop",
        "neon",
        "synthwave",
        "terminal",
        "riso",
        "aura",
        "mesh",
        "marquee",
      ]),
    );
  });

  it("defaults publicStyle to 'match'", () => {
    expect(base.display.publicStyle).toBe("match");
  });

  it.each(PUBLIC_STYLE_KEYS)(
    "renders a complete, CSP-clean, self-contained page with photo + self-highlight + reduced-motion: %s",
    (key) => {
      const cv = updateDisplay(withPhoto, { publicStyle: key });
      const html = renderPublicCvHtml(cv, { attribution: true });
      expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
      // No scripts — must stay legal under the strict public-page CSP.
      expect(html).not.toMatch(/<script/i);
      expect(html).toContain("default-src 'none'");
      // Honors the uploaded photo, the identifier-matched self-name highlight CSS,
      // and a reduced-motion fallback.
      expect(html).toContain('class="cv-photo"');
      expect(html).toContain("cv-self");
      expect(html).toContain("prefers-reduced-motion");
      expect(getPublicStyle(key).key).toBe(key);
    },
  );

  it("'match' renders with the document template (identical to renderCvHtml)", () => {
    const cv = updateDisplay(base, { publicStyle: "match", template: "modern" });
    expect(renderPublicCvHtml(cv, { attribution: true })).toBe(
      renderCvHtml(cv, { attribution: true }),
    );
  });

  it("an animated style differs from the document-template render", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "prism" });
    expect(renderPublicCvHtml(cv)).not.toBe(renderCvHtml(cv));
  });

  it("publicStyleGalleryPreviews renders a thumbnail for every style (incl. match)", () => {
    const previews = publicStyleGalleryPreviews(withPhoto);
    expect(previews).toHaveLength(PUBLIC_STYLES.length); // match + 9 animated
    expect(previews.map((p) => p.style)).toEqual([...PUBLIC_STYLES]);
    for (const p of previews) expect(p.html.startsWith("<!DOCTYPE html>")).toBe(true);
  });
});

describe("accentSpectrum", () => {
  it("maps the first var to the accent and fans the rest around the hue wheel", () => {
    const css = accentSpectrum(["--a", "--b", "--c"]);
    expect(css).toContain("@supports (color: oklch(from red l c h))");
    expect(css).toContain("--a: var(--cv-accent);");
    expect(css).toContain("--b: oklch(from var(--cv-accent) 0.72 0.2 calc(h + 120));");
    expect(css).toContain("--c: oklch(from var(--cv-accent) 0.72 0.2 calc(h + 240));");
  });

  it("supports accentFirst:false and custom lightness/chroma", () => {
    const css = accentSpectrum(["--x", "--y"], { l: 0.6, c: 0.18, accentFirst: false });
    expect(css).toContain("--x: oklch(from var(--cv-accent) 0.6 0.18 calc(h + 0));");
    expect(css).toContain("--y: oklch(from var(--cv-accent) 0.6 0.18 calc(h + 180));");
  });
});
