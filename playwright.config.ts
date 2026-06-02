import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// E2E runs against the dev server with a dedicated test env (see .env.e2e.example).
dotenv.config({ path: ".env.e2e" });

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e/journeys",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // One DB is shared across specs; keep it serial for isolation simplicity.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // dev mode avoids env.ts production-only assertions and a per-run Docker build
    command: "next dev -p 3100",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env } as Record<string, string>,
  },
});
