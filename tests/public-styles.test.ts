import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import {
  MASCOT_STYLES,
  PUBLIC_STYLES,
  isMascotStyle,
  type CanonicalCv,
} from "@/lib/canonical/schema";
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
  it("registers all 24 animated styles", () => {
    expect(PUBLIC_STYLE_KEYS).toHaveLength(24);
    expect(PUBLIC_STYLE_KEYS).toEqual(
      expect.arrayContaining([
        "posology",
        "hanko",
        "pharmacopoeia",
        "codex",
        "ledger",
        "atelier",
        "folio",
        "meridian",
        "trajectory",
        "lumina",
        "chronicle",
        "prism",
        "pop",
        "neon",
        "synthwave",
        "terminal",
        "riso",
        "aura",
        "mesh",
        "marquee",
        "clockwork",
        "arcade",
        "meadow",
        "cyberpunk",
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

  it("'posology' is an instrument page: the engraved dose–response curve margin + Space Grotesk", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "posology" });
    const html = renderPublicCvHtml(cv);
    // The engraved-curve margin (the signature) + its EC₅₀ marker.
    expect(html).toContain('class="po-curve"');
    expect(html).toContain("EC₅₀");
    // The fixed clinical-teal identity.
    expect(html).toContain("--po-teal:#0f7a5a");
    // The bundled characterful face, embedded under the CSP.
    expect(html).toContain("Space Grotesk");
    expect(html).toContain("@font-face");
  });

  it("'hanko' is an ukiyo-e page: the great-wave headings, ink scenery + the carved seal", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "hanko" });
    const html = renderPublicCvHtml(cv);
    // The tategaki margin + the carved seal on the name + the bilingual eyebrow.
    expect(html).toContain('class="hk-tate"');
    expect(html).toContain("履歴書 ・ Curriculum Vitæ");
    expect(html).toContain("header.cv-header h1::after");
    expect(html).toContain("--hk-seal:#b23a2c");
    // The ukiyo-e ink scenery (Fuji/seigaiha + enso + drifting leaves).
    expect(html).toContain('class="hk-scene"');
    expect(html).toContain('class="hk-enso"');
    expect(html).toContain('class="hk-leaves"');
    // A LIVING Prussian-blue Great Wave (inline svg) heads each section: the sea
    // heaves, the foam claws curl, the spray rises; it fades in (hk-deliver) and out.
    expect(html).toContain('<svg class="hk-wave"');
    expect(html).toContain('class="hk-sea"');
    expect(html).toContain("#1c3f5f");
    expect(html).toContain("@keyframes hk-heave");
    expect(html).toContain("@keyframes hk-curl");
    expect(html).toContain("@keyframes hk-deliver");
    expect(html).toContain("Newsreader");
    expect(html).toContain("@font-face");
  });

  it("'pharmacopoeia' is a lamplit specimen page: the botanical margin + Fraunces", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "pharmacopoeia" });
    const html = renderPublicCvHtml(cv);
    // The botanical-specimen margin (the signature) + the verdigris (not terracotta) accent.
    expect(html).toContain('class="ph-spec"');
    expect(html).toContain("--ph-verdigris:#35543f");
    expect(html).toContain("Materia Academica · Curriculum Vitæ");
    expect(html).toContain("Fraunces");
    expect(html).toContain("@font-face");
  });

  it("'codex' is a fine-press page: the illuminated margin, oxblood small-caps + EB Garamond", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "codex" });
    const html = renderPublicCvHtml(cv);
    // The illuminated vine margin (the signature) + the fleuron + small-caps self-name.
    expect(html).toContain('class="cx-vine"');
    expect(html).toContain('content:"❧"');
    expect(html).toContain("font-variant: small-caps");
    expect(html).toContain("--cx-oxblood:#7a2b35");
    expect(html).toContain("EB Garamond");
    expect(html).toContain("@font-face");
  });

  it("'ledger' is a working-paper page: numbered sections, the Abstract + the blueprint margin", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "ledger" });
    const html = renderPublicCvHtml(cv);
    // True-to-the-form structure + the ledger margin line-numbers (the signature).
    expect(html).toContain('content: counter(lg) "."');
    expect(html).toContain('content:"Abstract"');
    expect(html).toContain('class="lg-lines"');
    expect(html).toContain("--lg-navy:#1f3a5f");
    expect(html).toContain("Source Serif 4");
    expect(html).toContain("@font-face");
  });

  it("'atelier' is a gallery-wall page: the brass plate, plate numbers + Inter", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "atelier" });
    const html = renderPublicCvHtml(cv);
    // The brass-plate eyebrow (the signature) + plate-numbered wall labels.
    expect(html).toContain('content:"Selected Work · Curriculum Vitæ"');
    expect(html).toContain('content:"Pl. " counter(plate, decimal-leading-zero)');
    expect(html).toContain("--at-brass2:#9c8246");
    expect(html).toContain("Inter");
    expect(html).toContain("@font-face");
  });

  it("every animated field style keeps a reduced-motion fallback", () => {
    for (const key of [
      "posology",
      "hanko",
      "pharmacopoeia",
      "codex",
      "ledger",
      "atelier",
    ] as const) {
      const html = renderPublicCvHtml(updateDisplay(withPhoto, { publicStyle: key }));
      expect(html).toContain("@media (prefers-reduced-motion: reduce)");
      expect(html).not.toMatch(/<script/i);
    }
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

describe("mascot companion (display.showMascot)", () => {
  it("defaults showMascot to false", () => {
    expect(base.display.showMascot).toBe(false);
  });

  it("every animated style except the credible four is mascot-capable", () => {
    expect([...MASCOT_STYLES]).toHaveLength(13);
    for (const s of MASCOT_STYLES) expect(isMascotStyle(s)).toBe(true);
    // `match` + the credible styles are NOT mascot-capable (structural gate).
    for (const s of [
      "match",
      "posology",
      "hanko",
      "pharmacopoeia",
      "codex",
      "ledger",
      "atelier",
      "folio",
      "meridian",
      "trajectory",
      "lumina",
    ]) {
      expect(isMascotStyle(s)).toBe(false);
    }
  });

  it.each([...MASCOT_STYLES])(
    "renders exactly ONE aria-hidden Σ mascot with per-section hats, scroll-driven + reduced-motion-safe: %s",
    (style) => {
      const cv = updateDisplay(withPhoto, { publicStyle: style, showMascot: true });
      const html = renderPublicCvHtml(cv);
      // Exactly ONE mascot per document — the Σ-logo body with stacked per-section hats.
      expect(html.match(/<div class="sm" aria-hidden="true"><b class="sm-fig">/g)).toHaveLength(1);
      // It carries a section-typed hat (one per rendered section).
      expect(html).toMatch(/class="sm-hat sm-hat--[a-z-]+"/);
      // Travels with the scroll (`scroll(root)`) and binds each hat to its section's
      // `view()` timeline (hoisted via `timeline-scope`); all gated, CSS-only.
      expect(html).toContain("animation-timeline: scroll(root)");
      expect(html).toContain("timeline-scope:");
      expect(html).toContain("@supports (animation-timeline: view())");
      expect(html).not.toMatch(/<script/i);
      // Hidden under reduced motion (and the page declares the media query).
      expect(html).toContain("prefers-reduced-motion");
    },
  );

  it("omits the mascot element when not opted in, even on an eligible style", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "arcade", showMascot: false });
    // The eligible style always ships the (unused) mascot CSS; the mascot ELEMENT
    // must be absent when not opted in.
    expect(renderPublicCvHtml(cv)).not.toContain('<div class="sm" aria-hidden');
  });

  it("never renders the mascot on a credible style, even if opted in", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "folio", showMascot: true });
    expect(renderPublicCvHtml(cv)).not.toContain('<div class="sm" aria-hidden');
  });

  it("never leaks the mascot into a document/export render", () => {
    // Exports go through the document template (renderCvHtml), which has no mascot —
    // even with showMascot on and an eligible public style selected.
    const cv = updateDisplay(withPhoto, { publicStyle: "arcade", showMascot: true });
    expect(renderCvHtml(cv)).not.toContain('<div class="sm" aria-hidden');
  });
});
