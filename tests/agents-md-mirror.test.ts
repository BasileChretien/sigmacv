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

/** The lines of a guidance file from its shared opening line on, line endings aside. */
function body(file: string): string[] {
  const lines = readFileSync(join(repoRoot, file), "utf8").split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(BODY_STARTS));
  if (start === -1) throw new Error(`${file} has no line starting with "${BODY_STARTS}"`);
  return lines.slice(start);
}

describe("AGENTS.md", () => {
  it("is CLAUDE.md under its own header", () => {
    const agents = body("AGENTS.md");
    const claude = body("CLAUDE.md");
    const differs = claude.findIndex((line, i) => line !== agents[i]);
    // Named line by line so a failure says where to look, not just "not equal".
    expect(
      differs === -1
        ? "same"
        : `first difference at body line ${differs + 1}: ${claude[differs]?.slice(0, 80)}`,
    ).toBe("same");
    expect(agents).toHaveLength(claude.length);
  });

  it("keeps its own header, which says it is a mirror", () => {
    const head = readFileSync(join(repoRoot, "AGENTS.md"), "utf8").split(BODY_STARTS)[0];
    expect(head).toContain("# AGENTS.md");
    expect(head).toContain("Mirror of [`CLAUDE.md`](CLAUDE.md)");
  });
});
