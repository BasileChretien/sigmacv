import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Every `.ps1` in scripts/ must be pure ASCII with no BOM.
 *
 * Windows PowerShell 5.1 — still the default `powershell.exe`, and what you get
 * from a plain `.\script.ps1` — reads a BOM-less .ps1 as Windows-1252, not UTF-8.
 * A single em dash in a comment (`—` = E2 80 94) then decodes as `â€"`, whose last
 * character is a curly quote. That opens a string the parser never closes, and the
 * script dies with a cascade of "missing terminator" and "unexpected token" errors
 * pointing at lines that are perfectly fine.
 *
 * It cost a debugging round: the file parsed cleanly under PowerShell 7 (which
 * assumes UTF-8), so a pwsh-only syntax check declared it healthy while 5.1 could
 * not run it at all.
 *
 * Staying ASCII removes the dependency rather than papering over it — identical
 * bytes under both encodings, so it parses the same however PowerShell reads it.
 * A BOM would also work, but only by relying on the reader honouring it.
 */
const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts");
const psFiles = readdirSync(scriptsDir).filter((f) => f.endsWith(".ps1"));

describe("PowerShell scripts stay ASCII-only", () => {
  it("finds at least one .ps1 to check", () => {
    // Guards against the suite passing vacuously if the scripts move.
    expect(psFiles.length).toBeGreaterThan(0);
  });

  it.each(psFiles)("%s is pure ASCII with no BOM", (file) => {
    const buf = readFileSync(join(scriptsDir, file));

    const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    expect(hasBom, `${file} starts with a UTF-8 BOM; keep these files plain ASCII`).toBe(false);

    const offenders: string[] = [];
    const text = buf.toString("utf8");
    text.split("\n").forEach((line, i) => {
      // eslint-disable-next-line no-control-regex
      const bad = line.match(/[^\x00-\x7F]/g);
      if (bad)
        offenders.push(
          `line ${i + 1}: ${[...new Set(bad)].join(" ")}  (${line.trim().slice(0, 60)})`,
        );
    });

    expect(
      offenders,
      `${file} contains non-ASCII characters, which Windows PowerShell 5.1 misreads as ` +
        `Windows-1252 and fails to parse. Replace them with ASCII (e.g. "--" for an em dash).\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });
});
