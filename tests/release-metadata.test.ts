import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// A release names its version in eight files, and they have to agree. 0.3.0 left
// three behind: the lockfile said 0.2.0 at the tag, the home page's structured
// data said 0.2.0 through the whole life of 0.3.0, and the registry kit still
// said 0.1.0. Every file is read here, so a release that misses one is red.
//
// Not held here, because they can only be written once the release exists: the
// versioned DOI Zenodo mints for it (CITATION.cff's identifiers) and the "how to
// cite" lines that name a release beside its DOI (README, public/llms-full.txt).

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string): string => readFileSync(join(repoRoot, file), "utf8");

/** The one capture of `pattern` in `file`; a missing marker is a failure, not a skip. */
function marker(file: string, pattern: RegExp): string {
  const found = pattern.exec(read(file))?.[1];
  if (found === undefined) throw new Error(`${file}: nothing matches ${pattern}`);
  return found;
}

const pkg = JSON.parse(read("package.json")) as { version: string };
const lock = JSON.parse(read("package-lock.json")) as {
  version: string;
  packages: Record<string, { version?: string }>;
};
const codemeta = JSON.parse(read("codemeta.json")) as {
  version: string;
  dateModified: string;
  datePublished: string;
};
const zenodo = JSON.parse(read(".zenodo.json")) as { version: string };

const changelog = read("CHANGELOG.md");
/** The changelog's dated sections, newest first: `## [x.y.z] - yyyy-mm-dd`. */
const sections = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\r?$/gm)].map(
  ([, version, date]) => ({ version, date }),
);
const released = sections[0];

describe("release metadata", () => {
  it("names one version everywhere", () => {
    expect({
      "package-lock.json": lock.version,
      "package-lock.json (root package)": lock.packages[""]?.version,
      "CITATION.cff": marker("CITATION.cff", /^version: (\S+)\r?$/m),
      "codemeta.json": codemeta.version,
      ".zenodo.json": zenodo.version.replace(/^v/, ""),
      "src/components/StructuredData.tsx": marker(
        "src/components/StructuredData.tsx",
        /const APP_VERSION = "([^"]+)";/,
      ),
      "docs/registry-submissions.md": marker(
        "docs/registry-submissions.md",
        /^\| Version +\| (\S+) +\|\r?$/m,
      ),
      "CHANGELOG.md (newest dated section)": released?.version,
    }).toEqual({
      "package-lock.json": pkg.version,
      "package-lock.json (root package)": pkg.version,
      "CITATION.cff": pkg.version,
      "codemeta.json": pkg.version,
      ".zenodo.json": pkg.version,
      "src/components/StructuredData.tsx": pkg.version,
      "docs/registry-submissions.md": pkg.version,
      "CHANGELOG.md (newest dated section)": pkg.version,
    });
    // Zenodo's field carries the tag, the others the bare number.
    expect(zenodo.version).toBe(`v${pkg.version}`);
  });

  it("dates that version the same day everywhere", () => {
    const date = marker("CITATION.cff", /^date-released: "(\d{4}-\d{2}-\d{2})"\r?$/m);
    expect({
      "codemeta.json datePublished": codemeta.datePublished,
      "codemeta.json dateModified": codemeta.dateModified,
      "src/components/StructuredData.tsx": marker(
        "src/components/StructuredData.tsx",
        /const DATE_PUBLISHED = "([^"]+)";/,
      ),
      "CHANGELOG.md (newest dated section)": released?.date,
    }).toEqual({
      "codemeta.json datePublished": date,
      "codemeta.json dateModified": date,
      "src/components/StructuredData.tsx": date,
      "CHANGELOG.md (newest dated section)": date,
    });
  });

  it("links the changelog's sections to the tags they compare", () => {
    const repo = "https://github.com/BasileChretien/sigmacv";
    const lines = changelog.split(/\r?\n/);
    const definition = (label: string): string | undefined =>
      lines.find((line) => line.startsWith(`[${label}]: `));
    // Whole lines, and the base is read off the section below this release's: a
    // line copied from the last release with only its right-hand tag changed is
    // caught.
    const previous = sections[1]?.version;
    expect(definition("Unreleased")).toBe(`[Unreleased]: ${repo}/compare/v${pkg.version}...HEAD`);
    expect(definition(pkg.version)).toBe(
      `[${pkg.version}]: ${repo}/compare/v${previous}...v${pkg.version}`,
    );
  });
});
