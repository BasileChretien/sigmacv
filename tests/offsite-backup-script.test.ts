import { mkdtempSync, writeFileSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { bash, bashFinds, runScript, stubCommand } from "./helpers/bashScript";

/**
 * Guards for `scripts/offsite-backup.sh`. This script writes personal data to a
 * remote and deletes things there, so its refusals matter more than its happy
 * path: an unset remote must never be guessed at, and a misconfigured retention
 * window must never be able to empty the offsite copy.
 *
 * Every case below trips before the script shells out to rclone, so the tests
 * need no rclone, no remote, and touch nothing outside a temp directory.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "offsite-backup.sh");

const dirs: string[] = [];
function backupDir(): string {
  const d = mkdtempSync(join(tmpdir(), "sigmacv-off-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const run = (env: Record<string, string>) => runScript(script, env);

function writeDump(dir: string, name: string, bytes = 50_000, ageHours = 0): void {
  const p = join(dir, name);
  writeFileSync(p, Buffer.alloc(bytes, 0x41));
  if (ageHours > 0) {
    const t = new Date(Date.now() - ageHours * 3600_000);
    utimesSync(p, t, t);
  }
}

// Every guard under test runs before rclone is invoked, but the very first
// precondition IS "is rclone installed" — so where rclone is absent the script
// stops there and the later guards can't be reached. CI's runner has no rclone,
// which left those guards unrun there; a stand-in on PATH gets the script past the
// precondition on any machine, and keeps a real rclone (and a real remote) out of
// reach if a guard ever stopped holding.
function runPastRcloneCheck(env: Record<string, string>): { code: number; out: string } {
  return run({ ...stubCommand(backupDir(), "rclone"), ...env });
}

// A skip is silent, and CI is the one place these are guaranteed to run.
it.runIf(process.env.CI)("has a bash to run the script with on CI", () => {
  expect(bash).not.toBeNull();
});

describe.skipIf(bash === null)("offsite-backup.sh guards", () => {
  // Reachable only where the script's own lookup finds no rclone (CI's runner is one).
  it.skipIf(bashFinds("rclone"))("refuses to run without rclone, naming the install page", () => {
    const { code, out } = run({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "x:y" });
    expect(code).toBe(1);
    expect(out).toMatch(/rclone is not installed/i);
  });

  it("refuses to guess a destination for personal data", () => {
    const { code, out } = runPastRcloneCheck({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "" });
    expect(code).toBe(1);
    expect(out).toMatch(/RCLONE_REMOTE is unset/i);
    expect(out).toMatch(/refusing to guess a destination for personal data/i);
  });

  it("rejects a retention window below one day", () => {
    const dir = backupDir();
    writeDump(dir, "d.sql.gz");
    const { code, out } = runPastRcloneCheck({
      BACKUP_DIR: dir,
      RCLONE_REMOTE: "x:y",
      RETENTION_DAYS: "0",
    });
    expect(code).toBe(1);
    expect(out).toMatch(/RETENTION_DAYS must be >= 1/i);
  });

  it("rejects MIN_KEEP below one, so pruning can never empty the remote", () => {
    const dir = backupDir();
    writeDump(dir, "d.sql.gz");
    const { code, out } = runPastRcloneCheck({
      BACKUP_DIR: dir,
      RCLONE_REMOTE: "x:y",
      MIN_KEEP: "0",
    });
    expect(code).toBe(1);
    expect(out).toMatch(/MIN_KEEP must be >= 1/i);
  });

  it("fails when there is no local dump to copy", () => {
    const { code, out } = runPastRcloneCheck({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "x:y" });
    expect(code).toBe(1);
    expect(out).toMatch(/no local dump matching/i);
  });

  it("refuses to ship a stale dump offsite", () => {
    // Copying a stale dump would make the offsite freshness check pass while
    // the dump pipeline is already broken — worse than not copying at all.
    const dir = backupDir();
    writeDump(dir, "old.sql.gz", 50_000, 72);
    const { code, out } = runPastRcloneCheck({
      BACKUP_DIR: dir,
      RCLONE_REMOTE: "x:y",
      MAX_AGE_HOURS: "36",
    });
    expect(code).toBe(1);
    expect(out).toMatch(/fix the dump cron before copying it offsite/i);
  });

  it("fails on a missing backup directory", () => {
    const { code, out } = runPastRcloneCheck({
      BACKUP_DIR: join(tmpdir(), "sigmacv-does-not-exist-xyz"),
      RCLONE_REMOTE: "x:y",
    });
    expect(code).toBe(1);
    expect(out).toMatch(/does not exist/i);
  });
});
