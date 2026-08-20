import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the edge rules that exist purely for security. They live in the
 * Caddyfile, so nothing in the app fails if one is deleted — the app just
 * quietly starts answering requests it should never see. A security review
 * found `TRACE /` reaching Node and surfacing as a 500 (no reflection, no
 * stack trace — untidy, not exploitable); the allow-list below is the fix, and
 * these assertions are what keeps it from being dropped in a later edit.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const caddy = readFileSync(join(repoRoot, "Caddyfile"), "utf8");

describe("Caddy rejects methods the app never serves", () => {
  it("matches anything outside the allow-list", () => {
    expect(caddy).toContain("@bad_method not method GET HEAD POST PUT PATCH DELETE OPTIONS");
  });

  it("answers 405, so odd methods never reach Node", () => {
    expect(caddy).toContain("respond @bad_method 405");
  });

  // RFC 9110 §15.5.6: a 405 MUST carry Allow.
  it("sends an Allow header with the 405", () => {
    expect(caddy).toMatch(
      /header @bad_method Allow "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS"/,
    );
  });
});

describe("Caddy blocks the machine-to-machine surface", () => {
  it("404s /api/internal/* at the edge (cron reaches it inside the network)", () => {
    expect(caddy).toContain("@internal path /api/internal/*");
    expect(caddy).toContain("respond @internal 404");
  });

  it("overwrites X-Forwarded-For with the real peer, so rate limits can't be spoofed", () => {
    expect(caddy).toContain("header_up X-Forwarded-For {remote_host}");
  });
});

describe("deploy.sh actually applies a Caddyfile change", () => {
  const script = readFileSync(join(repoRoot, "scripts", "deploy.sh"), "utf8");
  // The comment block explains the trap and names the mounted path, so assert
  // against the executable lines only — otherwise the prose defeats the test.
  const commands = script
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

  it("copies the pulled Caddyfile into the container", () => {
    expect(commands).toContain('docker cp Caddyfile "$caddy_cid:/tmp/Caddyfile.deploy"');
  });

  // The regression this file exists for: `./Caddyfile:/etc/caddy/Caddyfile:ro`
  // is a single-file bind mount, so it pins the inode. `git pull` replaces the
  // file, and the running container keeps the old one — validating or reloading
  // the mounted path re-reads the PRE-pull config and reports success. The
  // deploy then looks clean while the edge serves the old rules.
  it("never validates or reloads the inode-pinned mount path", () => {
    expect(commands).not.toContain("/etc/caddy/Caddyfile");
  });

  it("validates and reloads the copy it just placed", () => {
    expect(commands).toContain("caddy validate --config /tmp/Caddyfile.deploy");
    expect(commands).toContain("caddy reload --config /tmp/Caddyfile.deploy");
  });

  it("validates before reloading, so a bad config never reaches the live edge", () => {
    const validate = commands.indexOf("caddy validate");
    const reload = commands.indexOf("caddy reload");
    expect(validate).toBeGreaterThan(-1);
    expect(reload).toBeGreaterThan(validate);
  });
});
