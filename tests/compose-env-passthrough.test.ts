import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The app container receives its environment through an explicit `environment:`
 * allowlist in the compose files — a variable added to the server `.env` does
 * NOTHING until the compose file passes it. This guard names the deploy-time
 * variables a shipped feature depends on, so the feature cannot silently stay
 * dormant in production (as the objection route did on 2026-09-09).
 */
const REQUIRED_PASSTHROUGH = [
  "PREVIEW_SUPPRESSION_KEY",
  "PREVIEW_SUPPRESSED_ORCID_HMACS",
  "EPO_OPS_KEY",
  "EPO_OPS_SECRET",
  "RESYNC_SECRET",
];

/** `      NAME: ${NAME}` or `      NAME: ${NAME:-default}` on its own line. */
function passthroughLine(name: string): RegExp {
  return new RegExp("^\\s+" + name + ": \\$\\{" + name + "(:-[^}]*)?\\}\\s*$", "m");
}

describe.each(["docker-compose.yml", "docker-compose.prod.yml"])(
  "%s passes every deploy-time variable to the app container",
  (file) => {
    const compose = readFileSync(file, "utf8");
    it.each(REQUIRED_PASSTHROUGH)("passes %s", (name) => {
      expect(compose).toMatch(passthroughLine(name));
    });
  },
);
