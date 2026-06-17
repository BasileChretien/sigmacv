/**
 * Floor the user's accent colour to a readable contrast on white.
 *
 * `accentColor` is validated only as a hex (the editor's accent picker has a free
 * colour input), and every template uses it BOTH as text on white (the Modern
 * name, Classic/Sidebar headings, links) AND as a panel background under white
 * text (the Sidebar). A too-light pick (a pale yellow, a light cyan) therefore
 * renders core CV text far below a readable contrast — in the HTML/PDF, and in
 * the LaTeX export's accent headings/name and full-height sidebar band.
 *
 * WCAG contrast is symmetric, so a single "readable on white" floor makes both
 * accent-as-text-on-white and white-on-accent safe. This is the one place that
 * logic lives; it is shared by every render path that turns the accent into a
 * colour — HTML/PDF (`resolveTheme`), LaTeX (`accentHex`), and the portable
 * `docStyle` profile.
 */

/** Darken `hex` toward black until it clears `min` WCAG contrast vs white.
 *
 * A no-op for any reasonably-saturated accent — all six `ACCENT_PRESETS` clear
 * ~5:1, above the 4.7 floor — so it only ever rescues a too-light custom pick
 * (e.g. a pale yellow at ~1.4:1). Hue is preserved: only the channels' shared
 * scale toward black changes, never their ratios.
 *
 * @param hex   a validated `#rrggbb` colour.
 * @param min   minimum contrast ratio vs white (default 4.7, just under the
 *              lightest preset so the curated palette is never touched).
 * @returns     a `#rrggbb` colour with contrast ≥ `min` vs white.
 */
export function ensureReadableOnWhite(hex: string, min = 4.7): string {
  const rgb = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const lum = (c: number[]): number => {
    const f = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0]! + 0.7152 * f[1]! + 0.0722 * f[2]!;
  };
  // Contrast of `c` against white (white luminance = 1).
  const contrast = (c: number[]): number => 1.05 / (lum(c) + 0.05);
  if (contrast(rgb) >= min) return hex;
  // Largest scale toward black (k in [0,1]) that still clears the floor — darken
  // as little as needed. Binary search converges to ~5 decimals in 24 steps.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const k = (lo + hi) / 2;
    if (contrast(rgb.map((c) => c * k)) >= min) lo = k;
    else hi = k;
  }
  const toHex = (v: number): string => Math.round(v).toString(16).padStart(2, "0");
  return `#${rgb.map((c) => toHex(c * lo)).join("")}`;
}
