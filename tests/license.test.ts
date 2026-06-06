import { describe, expect, it } from "vitest";
import { CV_LICENSE_KEYS, licenseInfo } from "@/lib/canonical/license";
import { CV_LICENSES } from "@/lib/canonical/schema";

describe("licenseInfo", () => {
  it("maps a linkable CC license to a name + SPDX URL", () => {
    expect(licenseInfo("CC-BY-4.0")).toEqual({
      key: "CC-BY-4.0",
      name: "CC BY 4.0",
      url: "https://spdx.org/licenses/CC-BY-4.0.html",
    });
    expect(licenseInfo("CC0-1.0")).toEqual({
      key: "CC0-1.0",
      name: "CC0 1.0",
      url: "https://spdx.org/licenses/CC0-1.0.html",
    });
    expect(licenseInfo("CC-BY-SA-4.0")).toEqual({
      key: "CC-BY-SA-4.0",
      name: "CC BY-SA 4.0",
      url: "https://spdx.org/licenses/CC-BY-SA-4.0.html",
    });
  });

  it("returns null for the two no-URL sentinels", () => {
    expect(licenseInfo("none")).toBeNull();
    expect(licenseInfo("all-rights-reserved")).toBeNull();
  });

  it("returns null for empty / unknown keys", () => {
    expect(licenseInfo(undefined)).toBeNull();
    expect(licenseInfo(null)).toBeNull();
    expect(licenseInfo("")).toBeNull();
    expect(licenseInfo("MIT")).toBeNull();
  });

  it("re-exports the canonical license key list", () => {
    expect(CV_LICENSE_KEYS).toBe(CV_LICENSES);
  });
});
