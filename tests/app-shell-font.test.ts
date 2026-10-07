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

/** `@fontsource-variable/inter` 5.3.0, `files/` — sha256 of each file as published. */
const PUBLISHED_SHA256: Record<string, string> = {
  "inter-cyrillic-ext-wght-normal.woff2":
    "ca157063339ac4ad418f214f3abfed119b0798ab4d377386ce5c9e5a7a435ebd",
  "inter-cyrillic-wght-normal.woff2":
    "71d5ee93cc1e9f1d520a3a8b66456de18c7879d8df09d57fcd2eaff75fef0075",
  "inter-greek-ext-wght-normal.woff2":
    "6e9e020a25f9b56d418f2c085b1d3c09725a4da23fe693a5b463064606732190",
  "inter-greek-wght-normal.woff2":
    "1be3448e292fbf05ffe176fe1e43f135013d50b1e7d324ad1a558f623d3bb6f6",
  "inter-latin-ext-wght-normal.woff2":
    "34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956",
  "inter-latin-wght-normal.woff2":
    "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
  "inter-vietnamese-wght-normal.woff2":
    "5c66f9e07e90c6d4ac4922cc68d60de26c17b1858e677fb5e603fce3952b3ff2",
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
const UNICODE_RANGE = /^U\+[0-9A-F]{4}(-[0-9A-F]{4})?(,U\+[0-9A-F]{4}(-[0-9A-F]{4})?)*$/;

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
    expect(committed).toEqual([...Object.keys(PUBLISHED_SHA256), "LICENSE.txt"].sort());

    for (const [file, sha256] of Object.entries(PUBLISHED_SHA256)) {
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
      Object.keys(PUBLISHED_SHA256)
        .map((file) => `./inter/${file}`)
        .sort(),
    );

    const ranges = calls.map(({ src, weight, display, declarations }) => {
      expect(weight, src).toBe("400 700");
      expect(display, src).toBe("swap");
      expect(declarations, src).toHaveLength(1);
      expect(declarations?.[0]?.prop, src).toBe("unicode-range");
      expect(declarations?.[0]?.value, src).toMatch(UNICODE_RANGE);
      return declarations?.[0]?.value;
    });
    expect(new Set(ranges).size).toBe(calls.length);
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
