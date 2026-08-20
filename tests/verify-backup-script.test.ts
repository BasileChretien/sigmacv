import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * `scripts/verify-backup.sh` is the thing that tells us the Postgres dumps are
 * real. If it silently passes on a stale or truncated dump it is worse than
 * nothing, because it converts "we never checked" into "we checked and it's
 * fine". So the guards get tested.
 *
 * Every case below trips BEFORE the script reaches Docker, so no stub is needed
 * and nothing touches a database. The restore and row-count halves genuinely
 * need a live Postgres and are exercised by running it on the server.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "verify-backup.sh");

// The script is bash; on Windows the vitest run may have no bash on PATH.
let bashAvailable = true;
try {
  execFileSync("bash", ["--version"], { stdio: "ignore" });
} catch {
  bashAvailable = false;
}

const dirs: string[] = [];
function backupDir(): string {
  const d = mkdtempSync(join(tmpdir(), "sigmacv-bak-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** Run the script and return its exit code plus combined output. */
function run(env: Record<string, string>): { code: number; out: string } {
  try {
    const out = execFileSync("bash", [script], {
      env: { ...process.env, ...env },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function writeDump(dir: string, name: string, bytes: number, ageHours = 0): string {
  const p = join(dir, name);
  writeFileSync(p, Buffer.alloc(bytes, 0x41));
  if (ageHours > 0) {
    const t = new Date(Date.now() - ageHours * 3600_000);
    utimesSync(p, t, t);
  }
  return p;
}

describe.skipIf(!bashAvailable)("verify-backup.sh guards", () => {
  it("refuses to run when the scratch DB is the live DB", () => {
    const dir = backupDir();
    const { code, out } = run({ BACKUP_DIR: dir, PG_DB: "sigmacv", SCRATCH_DB: "sigmacv" });
    expect(code).toBe(1);
    expect(out).toMatch(/refusing to touch the live database/i);
  });

  it("fails when no dump exists at all", () => {
    const { code, out } = run({ BACKUP_DIR: backupDir() });
    expect(code).toBe(1);
    expect(out).toMatch(/no backup matching/i);
  });

  it("fails when the newest dump is older than the age limit", () => {
    const dir = backupDir();
    writeDump(dir, "sigmacv-old.sql.gz", 50_000, 72);
    const { code, out } = run({ BACKUP_DIR: dir, MAX_AGE_HOURS: "36" });
    expect(code).toBe(1);
    expect(out).toMatch(/the backup cron has stopped producing dumps/i);
  });

  it("fails on a truncated dump", () => {
    const dir = backupDir();
    writeDump(dir, "sigmacv-tiny.sql.gz", 10);
    const { code, out } = run({ BACKUP_DIR: dir });
    expect(code).toBe(1);
    expect(out).toMatch(/almost certainly truncated/i);
  });

  it("fails when a dump suddenly shrinks against the previous one", () => {
    // The classic silent failure: pg_dump errors partway and still writes a
    // valid-looking gzip, so only the size trend gives it away.
    const dir = backupDir();
    writeDump(dir, "sigmacv-1.sql.gz", 1_000_000, 24);
    writeDump(dir, "sigmacv-2.sql.gz", 100_000, 1);
    const { code, out } = run({ BACKUP_DIR: dir, MIN_SIZE_RATIO: "50" });
    expect(code).toBe(1);
    expect(out).toMatch(/shrank to 10% of the previous one/i);
  });

  it("accepts a fresh dump of comparable size (reaching the restore step)", () => {
    const dir = backupDir();
    writeDump(dir, "sigmacv-1.sql.gz", 1_000_000, 24);
    writeDump(dir, "sigmacv-2.sql.gz", 990_000, 1);
    const { out } = run({ BACKUP_DIR: dir, PG_SERVICE: "definitely-not-a-service" });
    // Age/size all pass, so it proceeds to the restore and only then fails for
    // want of Docker — which is exactly how far this test can reach.
    expect(out).toMatch(/newest dump:/);
    expect(out).toMatch(/vs previous dump: 99%/);
    expect(out).not.toMatch(/stopped producing dumps|truncated|shrank to/i);
  });
});
