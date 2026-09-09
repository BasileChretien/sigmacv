import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Invariant from the institutions plan ("Live proxying" veto): no public
 * request to an institution page ever reaches OpenAlex or any other external
 * API. The institutions lib, its pages and its components read the database
 * only, through `@/lib/cv/listed` — never through `@/lib/cv/sync`, which pulls
 * in every client. Checked at the source level so a later PR cannot quietly
 * wire a client in: any import of an external-source client or of the sync
 * module, or a raw `fetch(`, fails here. The runtime counterpart (render every
 * route with `fetch` and `@/lib/http` torn out) is
 * `institution-pages-offline.test.tsx`.
 */
const ROOT = join(__dirname, "..");
const SCOPES = [
  "src/lib/institutions",
  "src/lib/cv/listed.ts",
  "src/app/i",
  "src/app/[locale]/i",
  "src/components/InstitutionIndex.tsx",
  "src/components/InstitutionPage.tsx",
  "src/components/InstitutionOpenAlexSection.tsx",
];
/** The two modules that DO talk to OpenAlex about institutions — the snapshot
 *  fetchers and the resync-tick refresh job — live under `src/lib/openalex/`,
 *  outside every scope above, and are reachable from the page only through the
 *  row they write. Named here so that a move into scope fails loudly. */
const OPENALEX_SIDE = [
  "src/lib/openalex/institutions.ts",
  "src/lib/openalex/institutionRefresh.ts",
];
const EXTERNAL_CLIENTS = [
  "@/lib/openalex",
  "@/lib/orcid",
  "@/lib/crossref",
  "@/lib/datacite",
  "@/lib/openaire",
  "@/lib/dblp",
  "@/lib/ror/client",
  "@/lib/wikidata",
  "@/lib/http",
  // Not a client, but it imports all of them.
  "@/lib/cv/sync",
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

describe("institution pages never call an external API", () => {
  const files = SCOPES.flatMap(sourceFiles);

  it("covers the lib (incl. the pure snapshot module), the listed-CV reader, the four routes and the three components", () => {
    expect(files.length).toBeGreaterThanOrEqual(11);
    expect(files.some((f) => f.endsWith("listed.ts"))).toBe(true);
    expect(files.some((f) => f.endsWith("snapshot.ts"))).toBe(true);
    expect(files.some((f) => f.endsWith("InstitutionOpenAlexSection.tsx"))).toBe(true);
  });

  it("keeps the OpenAlex-side snapshot modules outside the scanned scope, and the scope never imports them", () => {
    for (const path of OPENALEX_SIDE) {
      expect(statSync(join(ROOT, path)).isFile(), path).toBe(true);
      expect(files.some((f) => f.endsWith(path.replace(/\//g, "\\")) || f.endsWith(path))).toBe(
        false,
      );
    }
    // Both are covered by the `@/lib/openalex` prefix in EXTERNAL_CLIENTS.
    expect(EXTERNAL_CLIENTS).toContain("@/lib/openalex");
  });

  it.each(files)("%s imports no external-source client and never fetches", (file) => {
    const src = readFileSync(file, "utf8");
    for (const client of EXTERNAL_CLIENTS) expect(src, client).not.toContain(client);
    expect(src).not.toMatch(/\bfetch\s*\(/);
  });
});
