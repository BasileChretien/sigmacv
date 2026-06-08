/**
 * Import a WHO ICTRP export into Postgres (the `IctrpTrial` reference table).
 *
 * There is NO committed seed: WHO's terms forbid redistribution and require the
 * data to be kept current. This is DORMANT scaffolding — to enable the ICTRP
 * source the maintainer must, ONCE the use is cleared with WHO (ictrpinfo@who.int;
 * the data is non-commercial, attribution-required, and must be refreshed weekly):
 *
 *   1. Download the free WHO ICTRP weekly full-dataset export (CSV/XML).
 *   2. Convert it to gzip-NDJSON with one record per line of the shape below
 *      (mapping the WHO Trial Registration Data Set fields).
 *   3. Run:  npm run ictrp:import path/to/ictrp.ndjson.gz
 *      (i.e. dotenv -e .env -- tsx scripts/ictrp-import.ts <path>)
 *
 * Idempotent: replaces the table wholesale (delete-all + batched insert). Rows
 * from ClinicalTrials.gov / EU-CTR / CTIS are DROPPED — those trials are pulled
 * directly elsewhere, so importing them here would double-list. Re-run weekly.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const SEED = process.argv[2];
const BATCH = 5_000;

/** Source registers we already pull directly — never import them from ICTRP. */
const SKIP_REGISTERS = new Set([
  "clinicaltrials.gov",
  "clinicaltrials",
  "nct",
  "eu clinical trials register",
  "euctr",
  "eu-ctr",
  "ctis",
]);

interface IctrpRecord {
  trialId: string;
  sourceRegister: string;
  publicTitle: string;
  scientificTitle?: string | null;
  primarySponsor?: string | null;
  contactName: string;
  recruitmentStatus?: string | null;
  registrationYear?: number | null;
}

async function main(): Promise<void> {
  if (!SEED) {
    console.error(
      "Usage: npm run ictrp:import <path/to/ictrp.ndjson.gz>\n" +
        "No committed seed exists — provide a WHO ICTRP export converted to gzip-NDJSON.",
    );
    process.exit(1);
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Run via `npm run ictrp:import` (loads .env).");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log(`ICTRP import: seed = ${SEED}`);
  try {
    const removed = await prisma.ictrpTrial.deleteMany({});
    console.log(`  cleared ${removed.count} existing row(s)`);

    const rl = createInterface({
      input: createReadStream(SEED).pipe(createGunzip()),
      crlfDelay: Infinity,
    });

    let batch: IctrpRecord[] = [];
    let total = 0;
    let skipped = 0;
    const flush = async () => {
      if (batch.length === 0) return;
      await prisma.ictrpTrial.createMany({
        data: batch.map((r) => ({
          trialId: r.trialId,
          sourceRegister: r.sourceRegister,
          publicTitle: r.publicTitle,
          scientificTitle: r.scientificTitle ?? null,
          primarySponsor: r.primarySponsor ?? null,
          contactName: r.contactName,
          contactNameLower: r.contactName.toLowerCase(),
          recruitmentStatus: r.recruitmentStatus ?? null,
          registrationYear: r.registrationYear ?? null,
        })),
      });
      total += batch.length;
      batch = [];
      if (total % 50_000 === 0) console.log(`  inserted ${total} rows…`);
    };

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const rec = JSON.parse(trimmed) as IctrpRecord;
      if (!rec.trialId || !rec.publicTitle || !rec.contactName) continue;
      if (SKIP_REGISTERS.has((rec.sourceRegister ?? "").trim().toLowerCase())) {
        skipped++;
        continue;
      }
      batch.push(rec);
      if (batch.length >= BATCH) await flush();
    }
    await flush();

    console.log(
      `ICTRP import: done — ${total} rows imported (${skipped} CT.gov/EU rows skipped).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("ICTRP import failed:", err);
  process.exit(1);
});
