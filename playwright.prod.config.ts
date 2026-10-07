import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, SERVER_ENV } from "./e2e/production/env";

// The journeys (playwright.config.ts) run `next dev`, where script-src is
// `'self' 'unsafe-eval' 'unsafe-inline'` and nothing is prerendered. What a
// browser does with the PRODUCTION policy can only be seen on a production
// build, served the way the Docker image serves it. No database is needed.
//
// `npm run e2e:prod` builds first. Set E2E_PROD_REUSE_BUILD=1 to serve the build
// already in `.next` (CI does: its Build step has just made one); that build must
// have been given NEXT_PUBLIC_PLAUSIBLE_SRC, or the analytics checks say so.
const start = "node scripts/start-standalone.mjs";

export default defineConfig({
  testDir: "./e2e/production",
  // A dozen one-second tests against one server: serial is fast enough, and a
  // 2-core CI runner starting eight browsers at once is not.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["html", { outputFolder: "playwright-report-prod" }], ["list"]]
    : "list",
  // The default 5 s is tight for a first hit on a cold 2-core runner.
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_PROD_REUSE_BUILD === "1" ? start : `npm run build && ${start}`,
    url: `${BASE_URL}/about`,
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: "pipe",
    env: { ...(process.env as Record<string, string>), ...SERVER_ENV },
  },
});
