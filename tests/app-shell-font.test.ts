import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * The app-shell font (Inter) is served from files committed under
 * `src/app/fonts/inter/`, through `next/font/local`.
 *
 * It used to come through `next/font/google`, which fetches Google's stylesheet
 * on every `next build`. Google answers a small share of those requests with font
 * URLs Next cannot parse (vercel/next.js#99114), and the build then fails at
 * random: in CI, and in the Docker build that `scripts/deploy.sh` runs on the
 * server. Nothing at build or lint time says that a new `next/font/google` import
 * brings the flake back, so it has to fail here.
 *
 * The rest guards what the switch could break without anyone noticing: a subset
 * dropped (Russian pages and accented names fall to a system font), a subset
 * preloaded on every page, or the fallback face ahead of a subset in the stack.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = "src/app/fonts/inter";

interface PublishedFile {
  sha256: string;
  unicodeRange: string;
}

/**
 * `@fontsource-variable/inter` 5.3.0 as published: the sha256 of each file in `files/`
 * and the `unicode-range` its `wght.css` gives that file.
 */
const PUBLISHED: Record<string, PublishedFile> = {
  "inter-cyrillic-ext-wght-normal.woff2": {
    sha256: "ca157063339ac4ad418f214f3abfed119b0798ab4d377386ce5c9e5a7a435ebd",
    unicodeRange: "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
  },
  "inter-cyrillic-wght-normal.woff2": {
    sha256: "71d5ee93cc1e9f1d520a3a8b66456de18c7879d8df09d57fcd2eaff75fef0075",
    unicodeRange: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  },
  "inter-greek-ext-wght-normal.woff2": {
    sha256: "6e9e020a25f9b56d418f2c085b1d3c09725a4da23fe693a5b463064606732190",
    unicodeRange: "U+1F00-1FFF",
  },
  "inter-greek-wght-normal.woff2": {
    sha256: "1be3448e292fbf05ffe176fe1e43f135013d50b1e7d324ad1a558f623d3bb6f6",
    unicodeRange: "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
  },
  "inter-latin-ext-wght-normal.woff2": {
    sha256: "34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956",
    unicodeRange:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
  "inter-latin-wght-normal.woff2": {
    sha256: "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
    unicodeRange:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  "inter-vietnamese-wght-normal.woff2": {
    sha256: "5c66f9e07e90c6d4ac4922cc68d60de26c17b1858e677fb5e603fce3952b3ff2",
    unicodeRange:
      "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
  },
};

interface LocalFontOptions {
  src: string;
  weight?: string;
  display?: string;
  preload?: boolean;
  adjustFontFallback?: string | false;
  declarations?: { prop: string; value: string }[];
}

const calls = vi.hoisted(() => [] as LocalFontOptions[]);

// `next/font/local` only works inside Next's compiler. This stand-in records what
// each call asks for and answers with a family list of the shape Next builds: the
// face (named after its subset here), then its metric-adjusted fallback unless the
// call turned that off.
vi.mock("next/font/local", () => ({
  default: (options: LocalFontOptions) => {
    calls.push(options);
    const subset = /inter-([a-z-]+)-wght-normal/.exec(options.src)?.[1] ?? options.src;
    const fallback = options.adjustFontFallback === false ? "" : `, '${subset} Fallback'`;
    return { style: { fontFamily: `'${subset}'${fallback}` } };
  },
}));

import { INTER_ROOT_STYLE } from "@/app/fonts/inter";

const LATIN = "./inter/inter-latin-wght-normal.woff2";

function read(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

/** Every `.ts`/`.tsx` under `dir`, repo-relative, minus the generated Prisma client. */
function sourceFiles(dir: string): string[] {
  return readdirSync(join(repoRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return rel === "src/generated" ? [] : sourceFiles(rel);
    return /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

describe("app-shell font", () => {
  it("is not fetched from Google at build time: nothing in src/ imports next/font/google", () => {
    const offenders = sourceFiles("src").filter((file) =>
      /["']next\/font\/google["']/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it("ships the published Inter files, byte for byte, with the licence beside them", () => {
    const committed = readdirSync(join(repoRoot, FONT_DIR)).sort();
    expect(committed).toEqual([...Object.keys(PUBLISHED), "LICENSE.txt"].sort());

    for (const [file, { sha256 }] of Object.entries(PUBLISHED)) {
      const bytes = readFileSync(join(repoRoot, FONT_DIR, file));
      expect(createHash("sha256").update(bytes).digest("hex"), file).toBe(sha256);
    }

    const licence = read(`${FONT_DIR}/LICENSE.txt`);
    expect(licence).toContain("The Inter Project Authors (https://github.com/rsms/inter)");
    expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  it("loads every committed file once, limited to its own script by unicode-range", () => {
    const loaded = calls.map(({ src }) => src).sort();
    expect(loaded).toEqual(
      Object.keys(PUBLISHED)
        .map((file) => `./inter/${file}`)
        .sort(),
    );

    // The range must be the one published for THAT file: two ranges swapped, or
    // one cut short, would send a whole script to a system font with nothing else
    // failing.
    for (const { src, weight, display, declarations } of calls) {
      expect(weight, src).toBe("400 700");
      expect(display, src).toBe("swap");
      expect(declarations, src).toEqual([
        { prop: "unicode-range", value: PUBLISHED[src.replace("./inter/", "")]?.unicodeRange },
      ]);
    }
  });

  // A preloaded face is downloaded on every page whatever its script.
  it("preloads the latin file only", () => {
    const preloaded = calls.filter(({ preload }) => preload !== false).map(({ src }) => src);
    expect(preloaded).toEqual([LATIN]);
  });

  // The fallback face has no unicode-range: ahead of an Inter subset in the stack,
  // it would take that subset's characters and show them in Arial for good.
  it("names the seven subsets in --font-inter, latin first, and the one fallback last", () => {
    const withFallback = calls
      .filter(({ adjustFontFallback }) => adjustFontFallback !== false)
      .map(({ src }) => src);
    expect(withFallback).toEqual([LATIN]);

    expect(INTER_ROOT_STYLE["--font-inter"]).toBe(
      "'latin', 'latin-ext', 'vietnamese', 'greek', 'greek-ext', 'cyrillic', 'cyrillic-ext', 'latin Fallback'",
    );
  });

  it("is applied by the root layout, where globals.css reads --font-inter", () => {
    expect(read("src/app/layout.tsx")).toContain("style={INTER_ROOT_STYLE}");
    expect(read("src/app/globals.css")).toContain("var(--font-inter)");
  });
});
