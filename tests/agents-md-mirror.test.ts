import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// AGENTS.md says it is CLAUDE.md under another header, "identical apart from this
// header". Nothing held that, and by October 2026 it had lost a whole section
// (dependency hygiene) and nine entries. Both files open their shared body with
// the same line; from that line on they must be the same text.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const BODY_STARTS = "> **Not a user guide.**";
const SAME = "same";

/** A guidance file as its own header and the body it shares, line endings aside. */
function parts(file: string): { header: string[]; body: string[] } {
  const lines = readFileSync(join(repoRoot, file), "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(BODY_STARTS));
  if (start === -1) throw new Error(`${file} has no line starting with "${BODY_STARTS}"`);
  return { header: lines.slice(0, start), body: lines.slice(start) };
}

/** Where the two bodies first part, in words a contributor can act on; SAME if nowhere. */
function firstDifference(agents: string[], claude: string[]): string {
  for (let i = 0; i < Math.max(agents.length, claude.length); i++) {
    if (agents[i] === claude[i]) continue;
    const where = `body line ${i + 1}`;
    const fix = "Make the same edit in both files.";
    if (i >= claude.length) return `AGENTS.md has an extra ${where}: "${agents[i]}". ${fix}`;
    if (i >= agents.length) return `CLAUDE.md has an extra ${where}: "${claude[i]}". ${fix}`;
    return `${where} differs. CLAUDE.md: "${claude[i]?.slice(0, 80)}". ${fix}`;
  }
  return SAME;
}

describe("AGENTS.md", () => {
  it("is CLAUDE.md under its own header", () => {
    expect(firstDifference(parts("AGENTS.md").body, parts("CLAUDE.md").body)).toBe(SAME);
  });

  it("keeps its own header, which says it is a mirror", () => {
    const header = parts("AGENTS.md").header.join("\n");
    expect(header).toContain("# AGENTS.md");
    expect(header).toContain("Mirror of [`CLAUDE.md`](CLAUDE.md)");
  });

  // What stands above the shared body reaches one audience only. CLAUDE.md's part
  // is pinned, so that guidance added there is added on purpose, here as well.
  it("leaves nothing but the title and one sentence above CLAUDE.md's shared body", () => {
    expect(parts("CLAUDE.md").header).toEqual([
      "# CLAUDE.md",
      "",
      "This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.",
      "",
    ]);
  });
});
