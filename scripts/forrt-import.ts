/**
 * Import a FORRT Replication Database (FReD, https://forrt.org/replication-hub/)
 * export into Postgres (the `ForrtReplication` reference table).
 *
 * There is NO committed seed: the maintainer must download the dataset and run
 * this once (then periodically, on a refresh — see CLAUDE.md). FReD is CC-BY
 * (https://osf.io/, hosted by the Framework for Open and Reproducible Research
 * Training), so redistribution IS permitted with attribution — unlike WHO ICTRP —
 * but nothing is bundled yet.
 *
 *   1. Download the FReD export linked at https://forrt.org/replication-hub/
 *      (the FReD R package itself pulls it from https://osf.io/2tbvd/download).
 *      It is an XLSX WORKBOOK, not a CSV — convert it first, e.g.:
 *        python -c "import pandas as pd; pd.read_excel('fred.xlsx').to_csv('fred.csv', index=False)"
 *        (needs the `pandas` + `openpyxl` packages)
 *      or, without Python: `soffice --headless --convert-to csv fred.xlsx`
 *      (LibreOffice). This importer deliberately does NOT add an XLSX-parsing
 *      dependency — it only ever reads CSV, and fails loudly (see below) if
 *      handed the raw workbook.
 *   2. (Optionally) gzip the resulting CSV.
 *   3. Run:  npm run forrt:import path/to/fred.csv[.gz]
 *      (i.e. dotenv -e .env -- tsx scripts/forrt-import.ts <path>)
 *
 * Verified live 2026-09-04 against the actual OSF export (~4,396 rows, one
 * sheet). Header, in order:
 *   entry_id, effect_id, fred_id, ref_o, doi_o, study_o, ref_r, doi_r, url_r,
 *   study_r, author_overlap, author_overlap_pct, discipline, tags, description,
 *   claim_text_o, claim_page_o, n_o, es_value_o, es_type_o, es_repr_o,
 *   pval_value_o, pval_type_o, pval_tails_o, nested_o, prereg_o, n_r, es_value_r,
 *   es_type_r, es_repr_r, pval_value_r, pval_type_r, pval_tails_r, nested_r,
 *   prereg_r, reported_success, reported_success_quote,
 *   reported_success_quote_source, title_o, author_o, journal_o, year_o,
 *   volume_o, issue_o, pages_o, title_r, author_r, journal_r, year_r, volume_r,
 *   issue_r, pages_r, bibtex_o, bibtex_r, language_o, language_r
 * `COLUMN_CANDIDATES` below matches this header directly (`doi_o`/`doi_r`/
 * `ref_o`/`ref_r`/`url_r`/`reported_success`/`discipline`/`description`), plus
 * the older spellings this importer already tolerated in case a future export
 * renames columns again. The sheet also carries effect sizes (`es_value_o`/
 * `es_value_r`), sample sizes (`n_o`/`n_r`), titles/years (`title_o`/`year_o`/
 * `title_r`/`year_r`) and more — none of that is ingested here, since
 * `ForrtReplication` has no column to store it yet; a future enhancement can
 * extend both the Prisma schema and this list together. The dataset's own
 * changelog is at https://osf.io/fj3xc/download; citation text at
 * https://raw.githubusercontent.com/forrtproject/FReD-data/main/output/citation.txt.
 *
 * `reported_success` is the raw outcome column (free text like "success" /
 * "failure" / "mixed" / "informative failure", possibly other phrasings); the
 * FReD R package derives its own `result` column from it plus effect sizes
 * (`code_replication_outcomes()`). A value of `0` or empty means "not
 * classified" in the live sheet, so this importer treats it as unknown (null),
 * same as a genuinely blank cell — never stored as the literal string `"0"`.
 *
 * Idempotent: replaces the table wholesale (delete-all + batched insert), like
 * `scripts/ictrp-import.ts`. Re-run whenever a refreshed FReD export is
 * downloaded — see the CLAUDE.md go-live checklist for cadence + attribution.
 *
 * CSV parsing is line-based (RFC 4180 quoting within a single line: quoted
 * fields, escaped `""`, commas inside quotes) — NOTE: this does NOT handle a
 * quoted field containing an embedded newline (e.g. a `description` cell with
 * a line break, which a spreadsheet-to-CSV export can produce). If a real
 * FReD export turns out to need that, switch to a proper CSV library (e.g.
 * `csv-parse`) rather than extending this by hand.
 *
 * Rejects an XLSX/zip file outright (its own zip signature, `PK`, see
 * {@link assertNotXlsx}) so a maintainer who forgets the conversion step gets a
 * clear error instead of a silent "0 rows imported".
 */
import { open as openFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { createGunzip } from "node:zlib";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { bareDoiInput } from "../src/lib/openalex/client";

const SEED = process.argv[2];
const BATCH = 5_000;

/** Canonical fields we store, and their plausible header spellings (normalized:
 *  lower-cased, non-alphanumeric collapsed to a single space, trimmed). Listed
 *  strongest/most-likely-first; the first header that matches any candidate wins. */
const COLUMN_CANDIDATES: Record<string, string[]> = {
  originalDoi: ["doi o", "doi original", "original doi", "doi orig"],
  replicationDoi: ["doi r", "doi replication", "replication doi", "doi rep"],
  outcome: ["reported success", "result", "outcome", "replication outcome"],
  discipline: ["discipline", "field"],
  description: ["description"],
  originalRef: [
    "ref o",
    "ref original",
    "reference original",
    "original reference",
    "citation original",
  ],
  replicationRef: [
    "ref r",
    "ref replication",
    "reference replication",
    "replication reference",
    "citation replication",
  ],
  sourceUrl: ["url r", "url", "osf", "osf url", "link"],
};

interface ForrtRecord {
  originalDoi: string;
  replicationDoi?: string | null;
  outcome?: string | null;
  discipline?: string | null;
  description?: string | null;
  originalRef?: string | null;
  replicationRef?: string | null;
  sourceUrl?: string | null;
}

/** Normalize a header cell for tolerant matching: lower-case, collapse any run
 *  of non-alphanumeric characters (spaces, underscores, dots, …) to one space. */
function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parse one CSV line (RFC 4180 quoting, no embedded newlines — see the module
 *  doc comment). Tolerant of ragged rows (short/long relative to the header). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

/** Map a parsed header row to { canonicalField -> columnIndex }, tolerant of
 *  spelling/spacing/case per {@link COLUMN_CANDIDATES}. Unmatched fields are
 *  simply absent from the returned map (their rows read as undefined/null). */
export function matchColumns(
  header: string[],
): Partial<Record<keyof typeof COLUMN_CANDIDATES, number>> {
  const normalized = header.map(normalizeHeader);
  const out: Partial<Record<string, number>> = {};
  for (const [field, candidates] of Object.entries(COLUMN_CANDIDATES)) {
    const idx = normalized.findIndex((h) => candidates.includes(h));
    if (idx >= 0) out[field] = idx;
  }
  return out;
}

/** Build one {@link ForrtRecord} from a parsed data row + the resolved column
 *  map, or null when the row carries no usable original DOI. */
export function rowToRecord(
  cells: string[],
  columns: Partial<Record<keyof typeof COLUMN_CANDIDATES, number>>,
): ForrtRecord | null {
  const cell = (field: keyof typeof COLUMN_CANDIDATES): string | undefined => {
    const idx = columns[field];
    if (idx === undefined) return undefined;
    const v = cells[idx]?.trim();
    return v ? v : undefined;
  };
  const originalDoi = bareDoiInput(cell("originalDoi") ?? "");
  if (!originalDoi) return null;
  const replicationDoiRaw = cell("replicationDoi");
  const replicationDoi = replicationDoiRaw ? bareDoiInput(replicationDoiRaw) : null;
  // FReD's live `reported_success` column uses "0" for "not classified" — the
  // same as a blank cell, never a literal outcome label (mirrors the FReD R
  // package's own `code_replication_outcomes()` treatment of the column).
  const outcomeRaw = cell("outcome");
  const outcome = outcomeRaw && outcomeRaw !== "0" ? outcomeRaw : null;
  return {
    originalDoi,
    replicationDoi: replicationDoi ?? null,
    outcome,
    discipline: cell("discipline") ?? null,
    description: cell("description") ?? null,
    originalRef: cell("originalRef") ?? null,
    replicationRef: cell("replicationRef") ?? null,
    sourceUrl: cell("sourceUrl") ?? null,
  };
}

/** Reads the first `n` bytes of a file without decompressing it, so a gzipped
 *  CSV's own magic bytes (`1f 8b`) are what's seen here — not the XLSX zip
 *  signature {@link assertNotXlsx} guards against. */
async function readFirstBytes(path: string, n: number): Promise<Buffer> {
  const fh = await openFile(path, "r");
  try {
    const buf = Buffer.alloc(n);
    await fh.read(buf, 0, n, 0);
    return buf;
  } finally {
    await fh.close();
  }
}

/** Throws a clear, actionable error when `firstBytes` carries the zip file
 *  signature (`PK`, i.e. bytes `0x50 0x4B`) — the giveaway that this is the
 *  raw FReD XLSX workbook, not the CSV this importer expects. Exported so the
 *  check is unit-testable without touching the filesystem. */
export function assertNotXlsx(firstBytes: Uint8Array): void {
  if (firstBytes.length >= 2 && firstBytes[0] === 0x50 && firstBytes[1] === 0x4b) {
    throw new Error(
      "This looks like an XLSX workbook (zip signature 'PK'), not a CSV — FReD ships as an " +
        "XLSX file. Convert it to CSV first, e.g.:\n" +
        "  python -c \"import pandas as pd; pd.read_excel('fred.xlsx').to_csv('fred.csv', index=False)\" " +
        "(needs pandas + openpyxl)\n" +
        "  or: soffice --headless --convert-to csv fred.xlsx\n" +
        "then re-run: npm run forrt:import fred.csv",
    );
  }
}

async function main(): Promise<void> {
  if (!SEED) {
    console.error(
      "Usage: npm run forrt:import <path/to/fred.csv[.gz]>\n" +
        "No committed seed exists — provide a FReD export (see forrt.org/replication-hub).",
    );
    process.exit(1);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Run via `npm run forrt:import` (loads .env).");
    process.exit(1);
  }

  // Fail loudly (before touching the database) if handed the raw XLSX workbook.
  assertNotXlsx(await readFirstBytes(SEED, 2));

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`FORRT import: seed = ${SEED}`);
  try {
    const removed = await prisma.forrtReplication.deleteMany({});
    console.log(`  cleared ${removed.count} existing row(s)`);

    const raw = createReadStream(SEED);
    const input = SEED.endsWith(".gz") ? raw.pipe(createGunzip()) : raw;
    const rl = createInterface({ input, crlfDelay: Infinity });

    let columns: Partial<Record<keyof typeof COLUMN_CANDIDATES, number>> | null = null;
    let batch: ForrtRecord[] = [];
    let total = 0;
    let skipped = 0;
    const flush = async () => {
      if (batch.length === 0) return;
      await prisma.forrtReplication.createMany({ data: batch, skipDuplicates: true });
      total += batch.length;
      batch = [];
      if (total % 50_000 === 0) console.log(`  inserted ${total} rows…`);
    };

    for await (const line of rl) {
      if (!line.trim()) continue;
      if (columns === null) {
        columns = matchColumns(parseCsvLine(line));
        if (columns.originalDoi === undefined) {
          console.warn(
            "  WARNING: no column matched 'originalDoi' in the header — every row will be skipped. " +
              "Check COLUMN_CANDIDATES in scripts/forrt-import.ts against the real export header.",
          );
        }
        continue;
      }
      const rec = rowToRecord(parseCsvLine(line), columns);
      if (!rec) {
        skipped++;
        continue;
      }
      batch.push(rec);
      if (batch.length >= BATCH) await flush();
    }
    await flush();

    console.log(
      `FORRT import: done — ${total} rows imported (${skipped} row(s) skipped, no usable original DOI).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Run directly (`tsx scripts/forrt-import.ts <path>`) → import into Postgres.
// Guarded so the pure helpers above (parseCsvLine, matchColumns, rowToRecord)
// can be unit-tested by importing this module without triggering a real run.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error("FORRT import failed:", err);
    process.exit(1);
  });
}
