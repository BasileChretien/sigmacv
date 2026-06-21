import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  HK_WAVE_SCRIPT,
  HK_WAVE_SCRIPT_SHA256,
  HK_WAVE_SCRIPT_TAG,
  publicScriptSrc,
} from "@/lib/render/publicScripts";

describe("publicScripts — the one hash-pinned public-page script", () => {
  it("the stored SHA-256 matches the script exactly (no drift)", () => {
    const actual = createHash("sha256").update(HK_WAVE_SCRIPT, "utf8").digest("base64");
    expect(actual).toBe(HK_WAVE_SCRIPT_SHA256);
  });

  it("the script is a bare, audited IntersectionObserver — no eval/fetch/external", () => {
    expect(HK_WAVE_SCRIPT).toContain("IntersectionObserver");
    expect(HK_WAVE_SCRIPT).toContain("hk-play");
    // nothing dangerous
    expect(HK_WAVE_SCRIPT).not.toMatch(
      /eval|fetch|XMLHttpRequest|import|document\.write|innerHTML/,
    );
    expect(HK_WAVE_SCRIPT_TAG).toBe(`<script>${HK_WAVE_SCRIPT}</script>`);
  });

  it("emits a script-src directive ONLY when the trusted script is present", () => {
    expect(publicScriptSrc(`<body>${HK_WAVE_SCRIPT_TAG}</body>`)).toBe(
      ` script-src 'sha256-${HK_WAVE_SCRIPT_SHA256}';`,
    );
    // a page without the script (or with some other script) gets nothing
    expect(publicScriptSrc("<body>no scripts here</body>")).toBe("");
    expect(publicScriptSrc("<script>alert(1)</script>")).toBe("");
  });
});
