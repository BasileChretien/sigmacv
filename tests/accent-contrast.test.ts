import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { ACCENT_PRESETS } from "@/lib/canonical/schema";
import { renderCvLatex } from "@/lib/render/latex";
import { resolveTheme } from "@/lib/render/templates";
import { docStyle } from "@/lib/render/templateStyle";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const works = worksFixture as unknown as OpenAlexWork[];
const base = buildCanonicalCv({ id: "ac", resolved, works, now: "2026-06-02T00:00:00.000Z" });

/** WCAG contrast of a #rrggbb colour against white. */
function contrastVsWhite(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const f = channels.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * f[0]! + 0.7152 * f[1]! + 0.0722 * f[2]!;
  return 1.05 / (lum + 0.05);
}

const cvWith = (accentColor: string, extra: Record<string, unknown> = {}) =>
  updateDisplay(base, { accentColor, ...extra });
const themeAccent = (accentColor: string): string =>
  resolveTheme(cvWith(accentColor).display).accentColor;

// Free colour input lets users pick these; raw they render at ~1.4–2.7:1.
const LIGHT = ["#ffd60a", "#22d3ee", "#34d399", "#a3e635", "#fbbf24", "#ffffff"];

describe("accent contrast floor (HTML / resolveTheme)", () => {
  it("leaves every catalog preset untouched — they already clear the floor", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(themeAccent(preset)).toBe(preset);
      expect(contrastVsWhite(preset)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("darkens a too-light custom accent until it is readable on white", () => {
    for (const light of LIGHT) {
      const out = themeAccent(light);
      expect(out).not.toBe(light);
      expect(out).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrastVsWhite(out)).toBeGreaterThan(contrastVsWhite(light));
      expect(contrastVsWhite(out)).toBeGreaterThanOrEqual(4.45);
    }
  });

  it("preserves hue when darkening (channel ordering kept)", () => {
    const gold = themeAccent("#ffd60a");
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(gold.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b!);
    expect(g).toBeGreaterThan(b!);
  });

  it("derives accentSoft from the resolved (floored) accent", () => {
    const theme = resolveTheme(cvWith("#ffd60a").display);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(theme.accentColor.slice(i, i + 2), 16));
    expect(theme.accentSoft).toBe(`rgba(${r}, ${g}, ${b}, 0.08)`);
  });
});

describe("accent contrast floor (exports — docStyle + LaTeX)", () => {
  it("docStyle floors the accent too (presets unchanged, light darkened)", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(docStyle(cvWith(preset)).accent).toBe(preset);
    }
    for (const light of LIGHT) {
      const ds = docStyle(cvWith(light));
      expect(ds.accent).not.toBe(light);
      expect(ds.accentHex).toBe(ds.accent.slice(1).toUpperCase());
      expect(contrastVsWhite(ds.accent)).toBeGreaterThanOrEqual(4.45);
    }
  });

  it("the LaTeX \\definecolor{cvaccent} uses the floored hex", () => {
    const defOf = (tex: string): string => {
      const m = tex.match(/\\definecolor\{cvaccent\}\{HTML\}\{([0-9A-F]{6})\}/);
      return `#${m![1]}`;
    };
    // A preset passes through unchanged.
    const presetTex = renderCvLatex(cvWith("#1f4fd8", { template: "modern" }));
    expect(defOf(presetTex).toLowerCase()).toBe("#1f4fd8");
    // A pale accent is darkened so the .tex headings / name / sidebar band are
    // readable (Modern paints the name in cvaccent; Sidebar a white-on-cvaccent band).
    for (const t of ["modern", "sidebar"] as const) {
      const tex = renderCvLatex(cvWith("#ffd60a", { template: t }));
      expect(contrastVsWhite(defOf(tex))).toBeGreaterThanOrEqual(4.45);
    }
  });
});
