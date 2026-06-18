/**
 * Warn (non-fatally) before `next dev` when the Chromium build that the installed
 * `playwright` package expects isn't present locally — the thing that makes PDF
 * export fail with a 500 in dev.
 *
 * Why: a Playwright version bump (e.g. a Dependabot update) changes the pinned
 * Chromium revision, but `npm install` does NOT download browsers. Until you run
 * `npx playwright install chromium`, `chromium.launch()` throws "Executable
 * doesn't exist at …/chromium-<rev>/…" and the export route turns it into a
 * generic 500. This surfaces the real cause + the one-line fix up front instead.
 *
 * Behaviour (safe + fast):
 *   • Asks playwright-core for the exact executable path it WILL launch
 *     (honours PLAYWRIGHT_BROWSERS_PATH) and just checks the file exists.
 *   • Never installs anything, never fails the dev start — purely advisory.
 *   • If `playwright` isn't installed at all (e.g. a slimmed checkout), silently
 *     does nothing.
 *
 * Wired as `predev` / `predev:public`. Production/Docker get Chromium from the
 * Playwright base image instead (see Dockerfile + dockerfile-playwright-sync test).
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * Decide whether to warn, given the resolved executable path and an existence
 * check. Pure + exported so a unit test pins the logic without touching the FS.
 *   • no path (playwright absent / unresolved) → nothing to check, no warning
 *   • path present + file exists → ok, no warning
 *   • path present + file missing → warn (this is the broken-export case)
 */
export function chromiumStatus(execPath, fileExists) {
  if (!execPath) return { ok: true, warn: false };
  return { ok: fileExists, warn: !fileExists, execPath };
}

async function resolveChromiumPath() {
  try {
    const { chromium } = await import("playwright");
    return chromium.executablePath();
  } catch {
    // playwright not installed, or executablePath unavailable — nothing to check.
    return null;
  }
}

async function main() {
  const execPath = await resolveChromiumPath();
  const status = chromiumStatus(execPath, execPath ? existsSync(execPath) : false);
  if (status.warn) {
    console.warn(
      "\n[ensure-playwright] ⚠ Chromium for PDF export is missing:\n" +
        `    ${status.execPath}\n` +
        "  PDF export will 500 until you run:  npx playwright install chromium\n" +
        "  (A Playwright version bump changes the pinned browser — npm install won't fetch it.)\n",
    );
  }
}

const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
