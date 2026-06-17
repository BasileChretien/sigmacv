import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { ACCENT_PRESETS } from "@/lib/canonical/schema";
import { resolveTheme } from "@/lib/render/templates";
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

const accentFor = (accentColor: string): string =>
  resolveTheme(updateDisplay(base, { accentColor }).display).accentColor;

describe("accent contrast floor (resolveTheme)", () => {
  it("leaves every catalog preset untouched — they already clear the floor", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(accentFor(preset)).toBe(preset);
      expect(contrastVsWhite(preset)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("darkens a too-light custom accent until it is readable on white", () => {
    // A free colour input lets users pick these; raw, they render an unreadable
    // name/heading/link and white-on-accent sidebar (contrast ~1.4–2.7).
    for (const light of ["#ffd60a", "#22d3ee", "#34d399", "#a3e635", "#fbbf24", "#ffffff"]) {
      const resolved = accentFor(light);
      expect(resolved).not.toBe(light);
      expect(resolved).toMatch(/^#[0-9a-f]{6}$/);
      // Darkened (lower luminance) and now ~AA-readable on white.
      expect(contrastVsWhite(resolved)).toBeGreaterThan(contrastVsWhite(light));
      expect(contrastVsWhite(resolved)).toBeGreaterThanOrEqual(4.45);
    }
  });

  it("preserves hue when darkening (channel ordering kept)", () => {
    // Pure yellow stays a yellow/gold, not a grey or a shifted hue: red & green
    // channels stay dominant over blue.
    const gold = accentFor("#ffd60a");
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(gold.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b!);
    expect(g).toBeGreaterThan(b!);
  });

  it("derives accentSoft from the resolved (floored) accent", () => {
    const theme = resolveTheme(updateDisplay(base, { accentColor: "#ffd60a" }).display);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(theme.accentColor.slice(i, i + 2), 16));
    expect(theme.accentSoft).toBe(`rgba(${r}, ${g}, ${b}, 0.08)`);
  });
});
