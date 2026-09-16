import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Metabase ships its "Metabot" AI assistant ENABLED BY DEFAULT (all three of the
 * settings below default to `true` as of v0.63.18). This instance sets no LLM key,
 * so left at their defaults the scheduled generators run on every start and fail:
 *
 *   ERROR task.suggested-prompts-generator :: Suggested prompts generation
 *   failed: No Anthropic API key is set
 *
 * That is a red herring in the log people read to spot real failures, and the
 * feature itself would send this instance's schema and saved questions to a
 * third-party LLM — a decision to take deliberately, never by leaving a default.
 *
 * Nothing else can catch a regression here: no workflow builds or runs the compose
 * stack (see the note in .github/dependabot.yml), so a dropped line would only
 * surface as the ERROR quietly returning after some future deploy.
 */
const AI_SETTINGS_OFF = [
  "MB_AI_FEATURES_ENABLED",
  "MB_METABOT_ENABLED",
  "MB_EMBEDDED_METABOT_ENABLED",
];

describe("Metabase AI features stay off", () => {
  // Normalised to LF: the working copy is CRLF on Windows, and `.` in a JS regex
  // stops at `\r` (a line terminator), so a block match would fail there and pass
  // in CI — the worst possible split.
  const compose = readFileSync("docker-compose.yml", "utf8").replace(/\r\n/g, "\n");

  it.each(AI_SETTINGS_OFF)('sets %s to "false"', (name) => {
    // Quoted "false": an unquoted YAML `false` is a boolean, and Compose rejects a
    // non-string environment value rather than passing it to the container.
    expect(compose).toMatch(new RegExp("^\\s+" + name + ': "false"\\s*$', "m"));
  });

  it("keeps them on the metabase service, not some other one", () => {
    const metabase = compose.match(/^ {2}metabase:\n(?: {4}.*\n| *\n)*/m);
    expect(metabase, "no `metabase:` service block found").not.toBeNull();
    for (const name of AI_SETTINGS_OFF) {
      expect(metabase![0]).toContain(`${name}: "false"`);
    }
  });
});
