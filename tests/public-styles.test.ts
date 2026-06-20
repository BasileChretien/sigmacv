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

  it("'posology' draws the dose–response spine + stamps the self-name in a vermilion seal", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "posology" });
    const html = renderPublicCvHtml(cv);
    // The signature sigmoid spine + its EC₅₀ inflection marker.
    expect(html).toContain('class="poso-curve"');
    expect(html).toContain("EC₅₀");
    // The curve draws itself in (keyframed) and headings settle on a view() timeline.
    expect(html).toContain("@keyframes poso-draw");
    expect(html).toContain("animation-timeline: view()");
    // Fixed apothecary-teal identity (not accent-derived) + the vermilion seal ink.
    expect(html).toContain("--poso-accent:#1d9e75");
    expect(html).toContain("--poso-seal-ink:#9e2b1e");
    // Instrument: the breathing curve field + the cursor that traces the curve.
    expect(html).toContain('class="poso-field"');
    expect(html).toContain('class="poso-cursor"');
  });

  it("'hanko' stamps the name with a vermilion seal + draws the tokonoma scroll-rule", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "hanko" });
    const html = renderPublicCvHtml(cv);
    // The tokonoma scroll-rule element + the fixed washi/vermilion identity.
    expect(html).toContain('class="hk-scroll"');
    expect(html).toContain("--hk-seal:#b7352b");
    // The name-seal stamp is a CSS ::after on the masthead h1.
    expect(html).toContain("header.cv-header h1::after");
    expect(html).toContain("animation-timeline: view()");
    // Hanging-scroll furniture: sumi ink-wash + the vertical tategaki title.
    expect(html).toContain('class="hk-wash"');
    expect(html).toContain("履歴書");
  });

  it("'pharmacopoeia' lays a molecular lattice + highlights the self-name in amber", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "pharmacopoeia" });
    const html = renderPublicCvHtml(cv);
    // The benzene-ring lattice element + the apothecary parchment/sepia identity.
    expect(html).toContain('class="ph-lattice"');
    expect(html).toContain('id="ph-hex"');
    expect(html).toContain("--ph-accent:#7a4f1d");
    // The self-name gets the translucent amber highlighter wash.
    expect(html).toContain("--ph-mark:");
    expect(html).toContain("animation-timeline: view()");
    // Specimen-sheet furniture: graduated scale + a skeletal molecule + catalog Nº.
    expect(html).toContain('class="ph-scale"');
    expect(html).toContain('class="ph-molecule"');
    expect(html).toContain("counter(ph, decimal-leading-zero)");
  });

  it("'codex' draws the book-spine + sets the self-name in oxblood small-caps", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "codex" });
    const html = renderPublicCvHtml(cv);
    // The hardback book-spine element + the fleuron heading mark.
    expect(html).toContain('class="cx-spine"');
    expect(html).toContain('content:"❧"');
    // Fixed ivory/oxblood identity + small-caps self-name.
    expect(html).toContain("--cx-spine:#7a2b35");
    expect(html).toContain("font-variant: small-caps");
    expect(html).toContain("animation-timeline: view()");
    // Fine-press furniture: a gilt accent + the printer's-flower masthead ornament.
    expect(html).toContain("--cx-gold:#9c7b3f");
    expect(html).toContain('content:"❦"');
  });

  it("'ledger' numbers its sections + labels the summary 'Abstract'", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "ledger" });
    const html = renderPublicCvHtml(cv);
    // Numbered working-paper sections + the Abstract label + navy identity.
    expect(html).toContain('content: counter(lg) "."');
    expect(html).toContain('content:"Abstract"');
    expect(html).toContain("--lg-navy:#1f3a5f");
    expect(html).toContain("animation-timeline: view()");
    // Econometric furniture: the regression scatter plot + the ledger margin.
    expect(html).toContain('class="lg-plot"');
    expect(html).toContain('class="lg-margin"');
  });

  it("'atelier' uses an oversized portfolio hero + clay gallery labels", () => {
    const cv = updateDisplay(withPhoto, { publicStyle: "atelier" });
    const html = renderPublicCvHtml(cv);
    // Portfolio eyebrow + the fixed gallery-white / clay identity.
    expect(html).toContain('content:"Selected Work · Curriculum Vitæ"');
    expect(html).toContain("--at-accent-ink:#a04e38");
    expect(html).toContain("animation-timeline: view()");
    // Exhibition furniture: the gallery spotlight + plate-numbered wall labels.
    expect(html).toContain('class="at-spot"');
    expect(html).toContain('content:"Pl. " counter(plate, decimal-leading-zero)');
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
