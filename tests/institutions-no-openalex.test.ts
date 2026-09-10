import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
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
 * `institution-pages-offline.test.tsx`. The scope recurses, so the
 * reconciliation export (its pure row module, its assembler, the shared route
 * helper and both route handlers under `src/app/i/[ror]/`) is covered too — a
 * public GET of the export must reach the database alone, exactly like a page.
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
  "src/components/InstitutionFiguresSection.tsx",
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

  it("covers the lib (incl. the pure snapshot, share, aggregate, summing and reconciliation modules), the listed-CV reader, the four pages, the two export routes and the four components", () => {
    expect(files.length).toBeGreaterThanOrEqual(20);
    for (const name of [
      "listed.ts",
      "snapshot.ts",
      "oaShare.ts",
      "cvAggregates.ts",
      "aggregateSum.ts",
      "reconciliation.ts",
      "reconciliationRows.ts",
      "reconciliationRoute.ts",
      `reconciliation.csv${sep}route.ts`,
      `reconciliation.json${sep}route.ts`,
      "InstitutionOpenAlexSection.tsx",
      "InstitutionFiguresSection.tsx",
    ]) {
      expect(
        files.some((f) => f.endsWith(name)),
        name,
      ).toBe(true);
    }
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

/**
 * The plan's "Opt-out oracle" veto, at the source level: the researchers' own
 * figures (the per-CV aggregate, its k-anonymous sum and the section that
 * renders it) and OpenAlex's snapshot of the organisation (its pure module and
 * its section) never import each other and never name each other, so no code
 * path can receive both and subtract one from the other. The page composes the
 * two sections side by side; each is handed only its own data.
 */
describe("the opted-in figures and the OpenAlex snapshot never meet", () => {
  const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
  /** The module specifiers a file imports. */
  const imports = (src: string) => [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);
  /** The file with its comments stripped: prose may name the other side
   *  ("never OpenAlex's"); code must not. */
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
  const FIGURES_SIDE = [
    "src/lib/institutions/cvAggregates.ts",
    "src/lib/institutions/aggregateSum.ts",
    "src/components/InstitutionFiguresSection.tsx",
  ];
  const SNAPSHOT_SIDE = [
    "src/lib/institutions/snapshot.ts",
    "src/lib/institutions/oaShare.ts",
    "src/components/InstitutionOpenAlexSection.tsx",
  ];

  it.each(FIGURES_SIDE)(
    "%s imports nothing of, and names no symbol of, the OpenAlex snapshot",
    (path) => {
      const src = read(path);
      for (const spec of imports(src)) {
        expect(spec, spec).not.toMatch(/snapshot|openalex|InstitutionOpenAlexSection/i);
      }
      for (const symbol of [
        "InstitutionAggregates",
        "InstitutionOpenAlexSnapshot",
        "parseInstitutionAggregates",
        "openalexAggregates",
        "openAlexInstitutionUrl",
        "snapshot",
      ]) {
        expect(code(src), symbol).not.toContain(symbol);
      }
    },
  );

  it.each(SNAPSHOT_SIDE)(
    "%s imports nothing of, and names no symbol of, the opted-in figures",
    (path) => {
      const src = read(path);
      for (const spec of imports(src)) {
        expect(spec, spec).not.toMatch(
          /aggregateSum|cvAggregates|InstitutionFiguresSection|listed/,
        );
      }
      for (const symbol of [
        "InstitutionFigures",
        "SummedAggregates",
        "sumAggregates",
        "CvAggregates",
        "institutionAggregates",
        "figures",
      ]) {
        expect(code(src), symbol).not.toContain(symbol);
      }
    },
  );

  it("the page hands each section only its own data", () => {
    const page = read("src/components/InstitutionPage.tsx");
    expect(page).toContain("<InstitutionFiguresSection locale={loc} figures={summary.figures} />");
    expect(page).toContain(
      "<InstitutionOpenAlexSection locale={loc} snapshot={summary.openalex} />",
    );
  });
});
