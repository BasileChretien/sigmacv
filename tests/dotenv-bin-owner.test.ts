import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the `dotenv` binary. Every `db:*` and `*:import` npm script, and the
 * `predev` schema sync (`scripts/ensure-db.mjs`), runs `dotenv -e .env -- <cmd>`:
 * that is dotenv-cli's syntax. From v18 the `dotenv` package ships its own
 * `dotenv` binary with a different syntax (`dotenv run -f .env -- <cmd>`), and
 * when both packages sit at the top of node_modules npm links the package's
 * binary over dotenv-cli's. The scripts then print a usage message and exit 1,
 * and `predev` swallows the failure, so the dev DB silently stops syncing.
 * No CI job runs those scripts (E2E calls `npx prisma db push` directly),
 * which is how Dependabot's dotenv 18 PR (#526) came up green. It must fail here.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

type LockEntry = { version?: string; bin?: Record<string, string> | string };

function topLevelOwnersOfBin(bin: string): string[] {
  const lock = JSON.parse(readFileSync(join(repoRoot, "package-lock.json"), "utf8")) as {
    packages: Record<string, LockEntry>;
  };
  return Object.entries(lock.packages)
    .filter(([path]) => /^node_modules\/(@[^/]+\/)?[^/]+$/.test(path))
    .filter(([, entry]) => typeof entry.bin === "object" && bin in entry.bin)
    .map(([path, entry]) => `${path.slice("node_modules/".length)}@${entry.version}`);
}

describe("the dotenv binary", () => {
  it("is linked from dotenv-cli alone, the syntax every npm script uses", () => {
    const owners = topLevelOwnersOfBin("dotenv");
    expect(
      owners.map((o) => o.replace(/@[^@]+$/, "")),
      `node_modules/.bin/dotenv is claimed by ${owners.join(", ")}. The npm scripts ` +
        "need dotenv-cli's `dotenv -e .env -- <cmd>`; the `dotenv` package's own CLI " +
        "(v18+) rejects that syntax. Keep `dotenv` out of package.json (Node's " +
        "process.loadEnvFile covers what it did) or move every script to one CLI.",
    ).toEqual(["dotenv-cli"]);
  });

  it("is what the npm scripts call with dotenv-cli's -e flag", () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const dotenvScripts = Object.values(pkg.scripts).filter((s) => /^dotenv\s/.test(s));
    expect(dotenvScripts.length).toBeGreaterThan(0);
    for (const script of dotenvScripts) expect(script).toMatch(/^dotenv -e \S+ -- /);
  });
});
