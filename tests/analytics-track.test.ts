import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/lib/analytics/track";

// Save/restore the global so each test controls whether `window` (and
// `window.plausible`) exists, without leaking into other suites.
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.window = originalWindow;
});

describe("trackEvent", () => {
  it("calls window.plausible with props when present", () => {
    const plausible = vi.fn();
    globalThis.window = { plausible } as unknown as Window & typeof globalThis;

    trackEvent("Export", { format: "pdf" });

    expect(plausible).toHaveBeenCalledWith("Export", { props: { format: "pdf" } });
  });

  it("omits the options object when no props are given", () => {
    const plausible = vi.fn();
    globalThis.window = { plausible } as unknown as Window & typeof globalThis;

    trackEvent("Publish");

    expect(plausible).toHaveBeenCalledWith("Publish", undefined);
  });

  it("is a no-op (no throw) when plausible is not loaded", () => {
    globalThis.window = {} as unknown as Window & typeof globalThis;
    expect(() => trackEvent("Template", { template: "modern" })).not.toThrow();
  });

  it("is a no-op (no throw) during SSR when window is undefined", () => {
    // @ts-expect-error — simulate a server environment with no window.
    delete globalThis.window;
    expect(() => trackEvent("Export", { format: "docx" })).not.toThrow();
  });
});
