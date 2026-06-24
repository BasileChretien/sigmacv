import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { GET, HEAD } from "@/app/api/health/route";

/**
 * Guards the zero-downtime-redeploy wiring. The pieces only work together:
 * the `/api/health` endpoint must exist and answer 200, both compose files must
 * probe it, and Caddy must health-check it AND hold requests during a swap
 * (`lb_try_duration`). If any half is dropped, a redeploy silently goes back to
 * 502ing visitors mid-deploy — invisible until someone hits it at the wrong
 * moment (which is exactly how this started). So assert the contract here.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string): string => readFileSync(join(repoRoot, rel), "utf8");

describe("/api/health endpoint", () => {
  it("GET returns 200 with a JSON ok body (dependency-free liveness)", async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  it("HEAD returns 200 with no body (some probes use HEAD)", () => {
    const res = HEAD();
    expect(res.status).toBe(200);
  });
});

describe("Docker healthchecks probe /api/health", () => {
  for (const file of ["docker-compose.yml", "docker-compose.prod.yml"]) {
    it(`${file} app service has a healthcheck hitting /api/health`, () => {
      const yml = read(file);
      expect(yml).toContain("healthcheck:");
      expect(yml).toContain("/api/health");
    });
  }
});

describe("Caddy holds requests during a redeploy", () => {
  const caddy = read("Caddyfile");
  it("actively health-checks the app on /api/health", () => {
    expect(caddy).toContain("health_uri /api/health");
  });
  it("retries requests during the swap instead of 502ing (lb_try_duration)", () => {
    expect(caddy).toMatch(/lb_try_duration\s+\d+s/);
  });
});

describe("scripts/deploy.sh builds before swapping", () => {
  const script = read("scripts/deploy.sh");
  // Comments aside — the header explains what it replaces, `up -d --build`
  // included, so assert against the executable lines only.
  const commands = script
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

  it("builds the new image before recreating the container", () => {
    const build = commands.indexOf("build app");
    const up = commands.indexOf("up -d");
    expect(build).toBeGreaterThan(-1);
    expect(up).toBeGreaterThan(build);
  });
  it("does not run the downtime-causing `up -d --build`", () => {
    expect(commands).not.toContain("up -d --build");
  });
});
