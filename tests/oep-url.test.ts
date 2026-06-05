import { afterEach, describe, expect, it } from "vitest";
import { fetchEditorialRoles, isAllowedOepUrl } from "@/lib/oep/client";

describe("isAllowedOepUrl", () => {
  it("allows http(s) dataset URLs", () => {
    expect(isAllowedOepUrl("https://example.org/oep.json")).toBe(true);
    expect(isAllowedOepUrl("http://localhost:3001/oep.json")).toBe(true);
  });

  it("rejects non-http schemes and unparseable values", () => {
    expect(isAllowedOepUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedOepUrl("ftp://example.org/x")).toBe(false);
    expect(isAllowedOepUrl("not a url")).toBe(false);
  });

  it("blocks the cloud metadata endpoints + link-local always (SSRF defence-in-depth)", () => {
    expect(isAllowedOepUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isAllowedOepUrl("http://metadata.google.internal/computeMetadata/")).toBe(false);
    expect(isAllowedOepUrl("http://169.254.10.20/x")).toBe(false); // link-local range
  });

  it("blocks loopback/private ranges in production (but allows them in dev)", () => {
    const original = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      expect(isAllowedOepUrl("http://localhost:3001/oep.json")).toBe(false);
      expect(isAllowedOepUrl("http://127.0.0.1/x")).toBe(false);
      expect(isAllowedOepUrl("http://10.0.0.5/x")).toBe(false);
      expect(isAllowedOepUrl("http://192.168.1.9/x")).toBe(false);
      expect(isAllowedOepUrl("http://172.16.0.1/x")).toBe(false);
      // A genuine public dataset host still passes.
      expect(isAllowedOepUrl("https://data.example.org/oep.json")).toBe(true);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = original;
    }
  });
});

describe("fetchEditorialRoles guards", () => {
  afterEach(() => {
    delete process.env.OEP_DATA_URL;
  });

  it("returns [] when OEP_DATA_URL is unset", async () => {
    delete process.env.OEP_DATA_URL;
    expect(await fetchEditorialRoles("0000-0002-7483-2489")).toEqual([]);
  });

  it("returns [] (no fetch) when OEP_DATA_URL fails the host allowlist", async () => {
    process.env.OEP_DATA_URL = "file:///etc/passwd";
    expect(await fetchEditorialRoles("0000-0002-7483-2489")).toEqual([]);
  });
});
