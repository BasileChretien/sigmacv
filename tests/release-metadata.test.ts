import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// A release names its version in eight files, and they have to agree. 0.3.0 left
// three behind: the lockfile said 0.2.0 at the tag, the home page's structured
// data said 0.2.0 through the whole life of 0.3.0, and the registry kit still
// said 0.1.0. Every file is read here, so a release that misses one is red.
//
// Two things can only be written once the release exists: the versioned DOI
// Zenodo mints for it (CITATION.cff's identifiers) and the "how to cite" lines
// that name a release beside its DOI (README, public/llms-full.txt). They are
// held by the second group below, against one another and not against
// package.json: between a release and that follow-up they rightly still name the
// release before.

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

describe("how to cite", () => {
  // The versioned DOIs in CITATION.cff, oldest first, each with the release its
  // description names.
  const minted = [
    ...read("CITATION.cff").matchAll(
      /^ {2}- type: doi\r?\n {4}value: "(10\.5281\/zenodo\.\d+)"\r?\n {4}description: Versioned DOI for the SigmaCV v(\d+\.\d+\.\d+) release\.\r?$/gm,
    ),
  ].map(([, doi, version]) => ({ doi, version }));
  const newest = minted.at(-1);

  it("has one versioned DOI per release in CITATION.cff, oldest first", () => {
    const releases = sections.map((section) => section.version).reverse();
    // The newest release has none until Zenodo has minted it.
    expect([releases, releases.slice(0, -1)]).toContainEqual(minted.map((entry) => entry.version));
    // No DOI twice; compared as lists, so a failure shows the one that repeats.
    const dois = minted.map((entry) => entry.doi);
    expect(dois).toEqual([...new Set(dois)]);
  });

  // public/llms-full.txt was missed by the follow-ups of 0.2.0 and 0.3.0, and
  // cited v0.1.0 until 0.4.0.
  it("names the newest release that has a DOI, in the README and in llms-full.txt", () => {
    const readme = read("README.md");
    const current =
      /the current v(\d+\.\d+\.\d+) release itself is\s+\[(10\.5281\/zenodo\.\d+)\]\(https:\/\/doi\.org\/(10\.5281\/zenodo\.\d+)\)/.exec(
        readme,
      );
    expect({
      "README.md (the current release)": current?.[1],
      "README.md (its DOI, as text)": current?.[2],
      "README.md (its DOI, as link)": current?.[3],
      "README.md (citation)": marker("README.md", /_SigmaCV_ \(v(\d+\.\d+\.\d+)\)\. Zenodo\./),
      "public/llms-full.txt (citation)": marker(
        "public/llms-full.txt",
        /\*SigmaCV\* \(v(\d+\.\d+\.\d+)\)\. Zenodo\./,
      ),
    }).toEqual({
      "README.md (the current release)": newest?.version,
      "README.md (its DOI, as text)": newest?.doi,
      "README.md (its DOI, as link)": newest?.doi,
      "README.md (citation)": newest?.version,
      "public/llms-full.txt (citation)": newest?.version,
    });
  });
});
