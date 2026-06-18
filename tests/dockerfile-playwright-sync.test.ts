import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the load-bearing invariant in the Dockerfile: the Playwright runtime
 * base image (`mcr.microsoft.com/playwright:vX.Y.Z-noble`) ships a Chromium build
 * pinned to a specific Playwright version. If the `playwright` npm package is
 * bumped but the base-image tag isn't (e.g. a Dependabot minor/patch bump, which
 * can't touch the Dockerfile), the npm package launches Chromium by a revision the
 * image doesn't contain → `chromium.launch()` throws "Executable doesn't exist" →
 * every PDF export 500s ("Export failed"). This drift is invisible at build/lint
 * time, so it must fail CI here instead.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Dockerfile Playwright base image", () => {
  const pkg = JSON.parse(read("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const playwrightVersion = deps["playwright"];

  it("pins playwright exactly (so the base-image tag has a single version to match)", () => {
    // Exact pin, not a range — the base image is an exact tag, so a `^`/`~` range
    // would let npm resolve a Chromium the image can't supply.
    expect(playwrightVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(deps["@playwright/test"]).toBe(playwrightVersion);
  });

  it("matches the runtime base-image tag in the Dockerfile", () => {
    const dockerfile = read("Dockerfile");
    // Anchor to the runtime stage's `FROM … AS runner` line specifically — that's
    // the image that actually serves PDF rendering. An unanchored `playwright:v…`
    // match could pick up an incidental mention elsewhere (a builder-stage image,
    // an example tag in a comment) and validate the wrong line.
    const m = dockerfile.match(
      /^FROM\s+mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-[\w.]+\s+AS\s+runner/im,
    );
    expect(
      m,
      "no `FROM mcr.microsoft.com/playwright:vX.Y.Z-… AS runner` line found",
    ).not.toBeNull();
    const imageVersion = m![1];
    expect(
      imageVersion,
      `Dockerfile pins Playwright image v${imageVersion} but package.json has ` +
        `playwright ${playwrightVersion}. Bump the Dockerfile FROM tag to ` +
        `mcr.microsoft.com/playwright:v${playwrightVersion}-noble (PDF export 500s otherwise).`,
    ).toBe(playwrightVersion);
  });
});
