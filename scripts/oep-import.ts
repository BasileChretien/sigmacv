/**
 * Import the Open Editors Plus editorial-roles seed into Postgres.
 *
 * Reads the committed gzip-NDJSON seed (built from the OEP parquet by
 * scripts/oep-build-seed.py) and replaces the `OepEditorialRole` table wholesale
 * (delete-all + batched insert). Idempotent: safe to re-run on a dataset refresh.
 *
 * Run it with the project DATABASE_URL loaded:
 *     npm run oep:import
 *     # i.e. dotenv -e .env -- tsx scripts/oep-import.ts [path/to/seed.ndjson.gz]
 *
 * On the production server, run the same command once at launch (and whenever
 * you ship an updated seed). The app needs only Node — no Python on the server.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEFAULT_SEED = path.join(
  ROOT,
  "prisma",
  "seed-data",
  "oep-editorial-roles.ndjson.gz",
);
const SEED = process.argv[2] ?? DEFAULT_SEED;
const BATCH = 5_000;

interface SeedRecord {
  orcid: string;
  journal: string;
  role: string;
  roleStd?: string | null;
  publisher?: string | null;
  issn?: string | null;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set. Run via `npm run oep:import` (loads .env).",
    );
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`OEP import: seed = ${SEED}`);
  try {
    const removed = await prisma.oepEditorialRole.deleteMany({});
    console.log(`  cleared ${removed.count} existing row(s)`);

    const rl = createInterface({
      input: createReadStream(SEED).pipe(createGunzip()),
      crlfDelay: Infinity,
    });

    let batch: SeedRecord[] = [];
    let total = 0;
    const flush = async () => {
      if (batch.length === 0) return;
      await prisma.oepEditorialRole.createMany({
        data: batch.map((r) => ({
          orcid: r.orcid,
          journal: r.journal,
          role: r.role,
          roleStd: r.roleStd ?? null,
          publisher: r.publisher ?? null,
          issn: r.issn ?? null,
        })),
      });
      total += batch.length;
      batch = [];
      if (total % 50_000 === 0) console.log(`  inserted ${total} rows…`);
    };

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const rec = JSON.parse(trimmed) as SeedRecord;
      if (!rec.orcid || !rec.journal || !rec.role) continue;
      batch.push(rec);
      if (batch.length >= BATCH) await flush();
    }
    await flush();

    console.log(`OEP import: done — ${total} rows imported.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("OEP import failed:", err);
  process.exit(1);
});
