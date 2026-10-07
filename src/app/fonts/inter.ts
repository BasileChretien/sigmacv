import localFont from "next/font/local";
import type { CSSProperties } from "react";

/**
 * The app-shell typeface: Inter, served from the files committed in `./inter/`.
 *
 * It used to come through `next/font/google`, which downloads Google's stylesheet
 * on every `next build`. Google answers a small share of those requests with font
 * URLs Next cannot parse (vercel/next.js#99114), and the build then failed at
 * random, in CI and in the Docker build `scripts/deploy.sh` runs on the server.
 * With the files here, a build needs nothing from the network for this font.
 *
 * What the browser gets is what `next/font/google` emitted: the seven script
 * subsets Google Fonts cuts Inter into, each limited to its own characters by
 * `unicode-range`, so a page downloads only the scripts it uses. The latin file
 * (48 KB) is the only one preloaded; a Russian page fetches the Cyrillic one too,
 * a name with "ř" or "ő" the latin-ext one.
 *
 * `next/font/local` gives each call a font family of its own and takes one
 * `unicode-range` per call, hence one call per subset and a stack that names all
 * seven. Two rules hold that stack together:
 *   - Subsets are listed in the reverse of Google's stylesheet order. A few
 *     characters (combining accents, the dong sign) sit in more than one range;
 *     within one family the last `@font-face` declared wins, across families the
 *     first one listed does, so reversing keeps each character on the same file.
 *   - The metric-adjusted fallback (Arial resized to Inter's proportions, shown
 *     while Inter loads) has no `unicode-range`. It goes LAST, after every subset,
 *     or it would take the characters of the subsets listed after it and show them
 *     in Arial for good. Only the latin call generates one, since its file is the
 *     only one with the letters the adjustment is measured on.
 *
 * Each face is declared for weights 400 to 700, the four the app uses. The files
 * hold the whole 100–900 axis; a lighter or heavier request is clamped to that
 * range, as it was with four static declarations.
 *
 * The files are `files/inter-<subset>-wght-normal.woff2` of the npm package
 * `@fontsource-variable/inter` 5.3.0, unmodified, with the `unicode-range` its
 * `wght.css` gives each: Inter 4.001, © The Inter Project Authors, SIL Open Font
 * License 1.1 (`./inter/LICENSE.txt`, from https://github.com/rsms/inter).
 * `tests/app-shell-font.test.ts` pins their hashes, the options below and the
 * stack. Next wants font-loader options written as literals, which is why the
 * seven calls are spelled out.
 */
const interLatin = localFont({
  src: "./inter/inter-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const interLatinExt = localFont({
  src: "./inter/inter-latin-ext-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});

const interVietnamese = localFont({
  src: "./inter/inter-vietnamese-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
    },
  ],
});

const interGreek = localFont({
  src: "./inter/inter-greek-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
    },
  ],
});

const interGreekExt = localFont({
  src: "./inter/inter-greek-ext-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+1F00-1FFF" }],
});

const interCyrillic = localFont({
  src: "./inter/inter-cyrillic-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    { prop: "unicode-range", value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116" },
  ],
});

const interCyrillicExt = localFont({
  src: "./inter/inter-cyrillic-ext-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
    },
  ],
});

// A loader's `style.fontFamily` is a CSS family list: the face itself, then, for
// the latin call, its fallback.
const latinFamilies = interLatin.style.fontFamily.split(",").map((family) => family.trim());

const INTER_STACK = [
  ...latinFamilies.slice(0, 1),
  interLatinExt.style.fontFamily,
  interVietnamese.style.fontFamily,
  interGreek.style.fontFamily,
  interGreekExt.style.fontFamily,
  interCyrillic.style.fontFamily,
  interCyrillicExt.style.fontFamily,
  ...latinFamilies.slice(1),
].join(", ");

/** Inline style for `<html>`: defines `--font-inter`, which `globals.css` reads. */
export const INTER_ROOT_STYLE: CSSProperties & Record<"--font-inter", string> = {
  "--font-inter": INTER_STACK,
};
