import { describe, expect, it } from "vitest";
import { chromiumStatus } from "../scripts/ensure-playwright.mjs";

/**
 * Guards the predev Chromium check (scripts/ensure-playwright.mjs). The class of
 * bug this surfaces: a Playwright version bump changes the pinned Chromium
 * revision, but `npm install` doesn't fetch browsers, so `chromium.launch()`
 * throws "Executable doesn't exist" and PDF export 500s. The check warns ONLY
 * when a resolved executable path is genuinely missing — never on a healthy
 * install, and never when playwright can't be resolved at all.
 */
describe("ensure-playwright: chromiumStatus", () => {
  it("warns when the resolved Chromium executable is missing (the broken case)", () => {
    const path = "C:/ms-playwright/chromium-1228/chrome.exe";
    const status = chromiumStatus(path, false);
    expect(status).toEqual({ ok: false, warn: true, execPath: path });
  });

  it("stays quiet when the Chromium executable exists", () => {
    const path = "C:/ms-playwright/chromium-1228/chrome.exe";
    const status = chromiumStatus(path, true);
    expect(status).toEqual({ ok: true, warn: false, execPath: path });
  });

  it("does nothing when no path could be resolved (playwright absent)", () => {
    // fileExists is irrelevant here — a null/empty path means there is nothing to
    // check, so it must never warn (a slimmed checkout without playwright).
    expect(chromiumStatus(null, false)).toEqual({ ok: true, warn: false });
    expect(chromiumStatus(undefined, true)).toEqual({ ok: true, warn: false });
    expect(chromiumStatus("", false)).toEqual({ ok: true, warn: false });
  });
});
