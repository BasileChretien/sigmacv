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

/**
 * The self-archiving programme is editor-only for the same reason: the publisher
 * policy OA.Works records, the statutory table and the rights lines exist for the
 * owner's worklist alone (the stored fields are stripped by the projections —
 * self-archiving-fields.test.ts). No public scope imports the programme or the
 * OA.Works client, and the anonymous preview makes no OA.Works call: the pass runs
 * in `syncCvForUser`, never in the `buildCvFromOrcid` the preview shares. The
 * deposit routes follow the same rule: the repository pass's OpenAlex calls run in
 * the owner sync, `owner.depositRepositories` is stripped like the item fields
 * (deposit-repositories-fields.test.ts), and the routes render in the editor only.
 */
describe("the self-archiving programme never reaches a public surface", () => {
  const PROGRAMME = [
    "src/lib/archiving/selfArchivingPass.ts",
    "src/lib/archiving/statutoryRights.ts",
    "src/lib/archiving/rightsSentences.ts",
    "src/lib/oaworks/client.ts",
    "src/components/WorklistRights.tsx",
    "src/lib/archiving/depositRoutes.ts",
    "src/lib/archiving/depositRepositoriesPass.ts",
    "src/lib/archiving/repositoryDirectory.ts",
    "src/lib/archiving/currentAffiliation.ts",
    "src/lib/openalex/repositories.ts",
    "src/components/WorklistDeposit.tsx",
    "src/lib/archiving/repositoryCopiesPass.ts",
    "src/lib/repositoryCopies/shared.ts",
    "src/lib/repositoryCopies/hal.ts",
    "src/lib/repositoryCopies/europepmc.ts",
    "src/lib/repositoryCopies/openaire.ts",
    "src/lib/repositoryCopies/zenodo.ts",
  ];
  const files = PUBLIC_SCOPES.flatMap(sourceFiles);

  it("has the programme's modules to keep out", () => {
    for (const file of PROGRAMME) expect(existsSync(join(ROOT, file)), file).toBe(true);
  });

  it.each(files)("%s imports nothing from the programme nor the OA.Works client", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/["']@\/lib\/archiving/);
    expect(src).not.toMatch(/["']@\/lib\/oaworks/);
    expect(src).not.toMatch(
      /enrichCvWithSelfArchiving|fetchSelfArchivingPermission|statutoryArchivingFor|WorklistRights|enrichCvWithDepositRepositories|fetchAuthorRepositories|depositRoutes|WorklistDeposit|loadCurrentAffiliationCountry/,
    );
  });

  it("runs the OA.Works and repository passes in the owner sync only — never in the build the anonymous preview shares", () => {
    const sync = readFileSync(join(ROOT, "src/lib/cv/sync.ts"), "utf8");
    const buildStart = sync.indexOf("export async function buildCvFromOrcid");
    const ownerStart = sync.indexOf("export async function syncCvForUser");
    const ownerEnd = sync.indexOf("export async function", ownerStart + 1);
    expect(buildStart).toBeGreaterThan(0);
    expect(ownerStart).toBeGreaterThan(buildStart);
    const build = sync.slice(buildStart, ownerStart);
    const owner = sync.slice(ownerStart, ownerEnd);
    expect(build.length).toBeGreaterThan(2000);
    expect(build).not.toContain("enrichCvWithSelfArchiving");
    expect(owner).toContain("enrichCvWithSelfArchiving(");
    expect(build).not.toContain("enrichCvWithDepositRepositories");
    expect(owner).toContain("enrichCvWithDepositRepositories(");
    // The preview builder reaches the sources through buildCvFromOrcid alone.
    const preview = readFileSync(join(ROOT, "src/lib/cv/previewFromOrcid.ts"), "utf8");
    expect(preview).not.toContain("syncCvForUser");
  });
});
