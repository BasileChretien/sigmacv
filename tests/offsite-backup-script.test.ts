import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, utimesSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

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

let bashAvailable = true;
try {
  execFileSync("bash", ["--version"], { stdio: "ignore" });
} catch {
  bashAvailable = false;
}

const dirs: string[] = [];
function backupDir(): string {
  const d = mkdtempSync(join(tmpdir(), "sigmacv-off-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

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
// stops there and the later guards can't be reached.
let rcloneInstalled = true;
try {
  execFileSync("rclone", ["version"], { stdio: "ignore" });
} catch {
  rcloneInstalled = false;
}

describe.skipIf(!bashAvailable)("offsite-backup.sh guards", () => {
  it("refuses to run without rclone, naming the install page", () => {
    // Only meaningful on a machine without rclone; elsewhere the next guards cover it.
    if (rcloneInstalled) return;
    const { code, out } = run({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "x:y" });
    expect(code).toBe(1);
    expect(out).toMatch(/rclone is not installed/i);
  });

  describe.skipIf(!rcloneInstalled)("with rclone present", () => {
    it("refuses to guess a destination for personal data", () => {
      const { code, out } = run({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "" });
      expect(code).toBe(1);
      expect(out).toMatch(/RCLONE_REMOTE is unset/i);
      expect(out).toMatch(/refusing to guess a destination for personal data/i);
    });

    it("rejects a retention window below one day", () => {
      const dir = backupDir();
      writeDump(dir, "d.sql.gz");
      const { code, out } = run({ BACKUP_DIR: dir, RCLONE_REMOTE: "x:y", RETENTION_DAYS: "0" });
      expect(code).toBe(1);
      expect(out).toMatch(/RETENTION_DAYS must be >= 1/i);
    });

    it("rejects MIN_KEEP below one, so pruning can never empty the remote", () => {
      const dir = backupDir();
      writeDump(dir, "d.sql.gz");
      const { code, out } = run({ BACKUP_DIR: dir, RCLONE_REMOTE: "x:y", MIN_KEEP: "0" });
      expect(code).toBe(1);
      expect(out).toMatch(/MIN_KEEP must be >= 1/i);
    });

    it("fails when there is no local dump to copy", () => {
      const { code, out } = run({ BACKUP_DIR: backupDir(), RCLONE_REMOTE: "x:y" });
      expect(code).toBe(1);
      expect(out).toMatch(/no local dump matching/i);
    });

    it("refuses to ship a stale dump offsite", () => {
      // Copying a stale dump would make the offsite freshness check pass while
      // the dump pipeline is already broken — worse than not copying at all.
      const dir = backupDir();
      writeDump(dir, "old.sql.gz", 50_000, 72);
      const { code, out } = run({ BACKUP_DIR: dir, RCLONE_REMOTE: "x:y", MAX_AGE_HOURS: "36" });
      expect(code).toBe(1);
      expect(out).toMatch(/fix the dump cron before copying it offsite/i);
    });

    it("fails on a missing backup directory", () => {
      const { code, out } = run({
        BACKUP_DIR: join(tmpdir(), "sigmacv-does-not-exist-xyz"),
        RCLONE_REMOTE: "x:y",
      });
      expect(code).toBe(1);
      expect(out).toMatch(/does not exist/i);
    });
  });
});
