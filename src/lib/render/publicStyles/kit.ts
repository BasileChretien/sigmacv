/**
 * Shared helper for the public-page showcase styles.
 *
 * `accentSpectrum` re-derives a vivid palette from the user's `--cv-accent`
 * using CSS relative-color (`oklch(from var(--cv-accent) L C calc(h + offset))`),
 * so a style's whole theme rides the user's chosen accent. It is emitted as an
 * `@supports (color: oklch(from red l c h)) { … }` block appended AFTER the
 * style's literal `:root` palette, so browsers without relative-color support
 * keep the style's hard-coded fallback colours.
 */
export function accentSpectrum(
  vars: string[],
  opts: { l?: number; c?: number; accentFirst?: boolean } = {},
): string {
  const { l = 0.72, c = 0.2, accentFirst = true } = opts;
  const n = vars.length;
  const decls = vars
    .map((name, i) => {
      // The first var maps to the accent itself; the rest fan out evenly around
      // the hue wheel at a fixed vivid lightness/chroma.
      if (i === 0 && accentFirst) return `${name}: var(--cv-accent);`;
      const h = Math.round((360 / n) * i);
      return `${name}: oklch(from var(--cv-accent) ${l} ${c} calc(h + ${h}));`;
    })
    .join(" ");
  return `\n  @supports (color: oklch(from red l c h)) { :root { ${decls} } }`;
}
