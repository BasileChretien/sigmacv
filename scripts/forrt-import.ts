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
 *   1. Download the FReD CSV export from the OSF project linked at
 *      https://forrt.org/replication-hub/.
 *   2. (Optionally) gzip it.
 *   3. Run:  npm run forrt:import path/to/fred.csv[.gz]
 *      (i.e. dotenv -e .env -- tsx scripts/forrt-import.ts <path>)
 *
 * TODO(verify-live): the exact FReD column names are undocumented here (the dev
 * machine has no internet access to inspect a live export), so this reads the
 * header row and matches columns TOLERANTLY (case/space-insensitive, several
 * candidate spellings per field — see {@link COLUMN_CANDIDATES}). Re-check the
 * candidate list against a real export before the first production import; an
 * unmatched required column (`originalDoi`) makes every row skip harmlessly
 * rather than crash, so a naming drift shows up as "0 rows imported", not a
 * throw.
 *
 * Idempotent: replaces the table wholesale (delete-all + batched insert), like
 * `scripts/ictrp-import.ts`. Re-run whenever a refreshed FReD export is
 * downloaded — see the CLAUDE.md go-live checklist for cadence + attribution.
 *
 * CSV parsing is line-based (RFC 4180 quoting within a single line: quoted
 * fields, escaped `""`, commas inside quotes) — TODO(verify-live): does NOT
 * handle a quoted field containing an embedded newline. If a real FReD export
 * turns out to need that, switch to a proper CSV library (e.g. `csv-parse`)
 * rather than extending this by hand.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
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
  originalDoi: ["doi original", "original doi", "doi o", "doi orig"],
  replicationDoi: ["doi replication", "replication doi", "doi r", "doi rep"],
  outcome: ["result", "outcome", "replication outcome"],
  discipline: ["discipline", "field"],
  description: ["description"],
  originalRef: ["ref original", "reference original", "original reference", "citation original"],
  replicationRef: [
    "ref replication",
    "reference replication",
    "replication reference",
    "citation replication",
  ],
  sourceUrl: ["url", "osf", "osf url", "link"],
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
export function matchColumns(header: string[]): Partial<Record<keyof typeof COLUMN_CANDIDATES, number>> {
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
  return {
    originalDoi,
    replicationDoi: replicationDoi ?? null,
    outcome: cell("outcome") ?? null,
    discipline: cell("discipline") ?? null,
    description: cell("description") ?? null,
    originalRef: cell("originalRef") ?? null,
    replicationRef: cell("replicationRef") ?? null,
    sourceUrl: cell("sourceUrl") ?? null,
  };
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

    console.log(`FORRT import: done — ${total} rows imported (${skipped} row(s) skipped, no usable original DOI).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("FORRT import failed:", err);
  process.exit(1);
});
