import { mkdtempSync, writeFileSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bash, runScript, stubCalls, stubCommand } from "./helpers/bashScript";

/**
 * `scripts/verify-backup.sh` is the thing that tells us the Postgres dumps are
 * real. If it silently passes on a stale or truncated dump it is worse than
 * nothing, because it converts "we never checked" into "we checked and it's
 * fine". So the guards get tested.
 *
 * Every guard below trips before the restore, but not before Docker: once past
 * its first guard the script drops the scratch database on EVERY exit (an EXIT
 * trap calling `docker compose exec … psql`). So each run gets a stand-in
 * `docker` first on PATH. Nothing here can reach a real daemon or database, and
 * the tests can read what the script asked Docker to do. The restore and
 * row-count halves genuinely need a live Postgres and are exercised by running
 * it on the server.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "verify-backup.sh");

const dirs: string[] = [];
function backupDir(): string {
  const d = mkdtempSync(join(tmpdir(), "sigmacv-bak-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** Run the script behind a stand-in `docker`, and report what it sent there. */
function run(env: Record<string, string>): { code: number; out: string; dockerCalls: string[] } {
  const stubDir = backupDir();
  const result = runScript(script, { ...env, ...stubCommand(stubDir, "docker") });
  return { ...result, dockerCalls: stubCalls(stubDir, "docker") };
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

// A skip is silent, and CI is the one place these are guaranteed to run.
it.runIf(process.env.CI)("has a bash to run the script with on CI", () => {
  expect(bash).not.toBeNull();
});

describe.skipIf(bash === null)("verify-backup.sh guards", () => {
  it("refuses to run when the scratch DB is the live DB", () => {
    const dir = backupDir();
    const { code, out, dockerCalls } = run({
      BACKUP_DIR: dir,
      PG_DB: "sigmacv",
      SCRATCH_DB: "sigmacv",
    });
    expect(code).toBe(1);
    expect(out).toMatch(/refusing to touch the live database/i);
    // The refusal has to come before the EXIT trap exists: with the trap armed,
    // exiting here would send DROP DATABASE for the live database's name.
    expect(dockerCalls).toEqual([]);
  });

  it("fails when no dump exists at all", () => {
    const { code, out } = run({ BACKUP_DIR: backupDir() });
    expect(code).toBe(1);
    expect(out).toMatch(/no backup matching/i);
  });

  it("drops only the scratch database when a guard stops the run", () => {
    const { dockerCalls } = run({ BACKUP_DIR: backupDir() });
    expect(dockerCalls).toEqual([
      'compose exec -T postgres psql -qX -U sigmacv -d postgres -c DROP DATABASE IF EXISTS "restore_test";',
    ]);
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
    // Age/size all pass, so it proceeds to the restore and only then fails, on
    // the stand-in docker — which is exactly how far this test can reach.
    expect(out).toMatch(/newest dump:/);
    expect(out).toMatch(/vs previous dump: 99%/);
    expect(out).not.toMatch(/stopped producing dumps|truncated|shrank to/i);
    expect(out).toMatch(/stub docker was executed with: compose exec -T definitely-not-a-service/);
  });
});
