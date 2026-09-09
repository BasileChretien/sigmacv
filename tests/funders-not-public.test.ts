import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Nothing about the funder join is public. The join (the owner's own grants
 * against the funders printed on their works), the OpenAlex funder crosswalk
 * and the funder open-access policy table exist for the owner's editor
 * worklist only; `meta.funders` stays stripped from every public surface
 * (work-funders.test.ts). Checked at the source level: no file under a public
 * route, the OAI endpoint, the public JSON-LD, the public projection / formats,
 * the renderers (exports), the snapshot (frozen version) code or the anonymous
 * no-login preview (route, workspace, builder) imports anything from
 * `src/lib/funders/` — nor the OpenAlex crosswalk WRITER (`openalex/funders.ts`
 * `recordWorkFunders`), which belongs to the authenticated sync alone.
 */
const ROOT = join(__dirname, "..");
const PUBLIC_SCOPES = [
  "src/app/p",
  "src/app/i",
  "src/app/[locale]/i",
  "src/app/api/oai",
  "src/app/api/cv/export",
  "src/app/api/cv/snapshots",
  "src/app/api/preview",
  "src/components/PreviewWorkspace.tsx",
  "src/lib/oai",
  "src/lib/render",
  "src/lib/cv/previewFromOrcid.ts",
  "src/lib/cv/publicJsonLd.ts",
  "src/lib/cv/publicProjection.ts",
  "src/lib/cv/publicFormats.ts",
  "src/lib/cv/snapshots.ts",
  "src/lib/cv/snapshotHash.ts",
  "src/lib/cv/snapshotPage.ts",
  "src/lib/cv/snapshotShape.ts",
  "src/lib/cv/snapshotStore.ts",
];
const FUNDERS_LIB = [
  "src/lib/funders/join.ts",
  "src/lib/funders/crosswalk.ts",
  "src/lib/funders/oaPolicies.ts",
];

function sourceFiles(path: string): string[] {
  const abs = join(ROOT, path);
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return /\.(ts|tsx)$/.test(entry.name) ? [join(ROOT, child)] : [];
  });
}

describe("the funder join never reaches a public surface", () => {
  it("scans every public scope, and the funders lib exists to be kept out of them", () => {
    for (const scope of PUBLIC_SCOPES) expect(existsSync(join(ROOT, scope)), scope).toBe(true);
    for (const file of FUNDERS_LIB) expect(existsSync(join(ROOT, file)), file).toBe(true);
  });

  const files = PUBLIC_SCOPES.flatMap(sourceFiles);

  it("covers a sane number of files", () => {
    expect(files.length).toBeGreaterThanOrEqual(30);
  });

  it.each(files)("%s imports nothing from src/lib/funders nor the crosswalk writer", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/["']@\/lib\/funders/);
    expect(src).not.toMatch(/["']@\/lib\/openalex\/funders/);
    expect(src).not.toMatch(/["'][./]*\/funders["/]/);
    expect(src).not.toMatch(/oaPolicies|joinOwnerFunding|loadFunderCrosswalk|recordWorkFunders/);
  });
});
