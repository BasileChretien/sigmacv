import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    previewSuppression: {
      findUnique: mocks.findUnique,
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}));
vi.mock("@/lib/cv/orcidPreviewCache", () => ({ invalidateOrcidPreview: mocks.invalidate }));
vi.mock("@/lib/log", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  PREVIEW_SUPPRESSION_KEY: "k".repeat(24),
});

import {
  isOrcidPreviewSuppressed,
  previewSuppressionHmac,
  setOrcidPreviewSuppressed,
} from "@/lib/cv/previewSuppression";
import { __resetEnvForTests } from "@/lib/env";

const ORCID = "0000-0002-1825-0097";
const HMAC = previewSuppressionHmac(ORCID, "k".repeat(24));

beforeEach(() => {
  mocks.findUnique.mockReset();
  mocks.upsert.mockReset();
  mocks.deleteMany.mockReset();
  mocks.invalidate.mockReset();
  process.env.PREVIEW_SUPPRESSION_KEY = "k".repeat(24);
  delete process.env.PREVIEW_SUPPRESSED_ORCID_HMACS;
  __resetEnvForTests();
});
afterEach(() => __resetEnvForTests());

describe("isOrcidPreviewSuppressed", () => {
  it("looks the iD up by its keyed HMAC, never the plaintext iD", async () => {
    mocks.findUnique.mockResolvedValue({ orcidHmac: HMAC });
    await expect(isOrcidPreviewSuppressed(ORCID)).resolves.toBe(true);
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { orcidHmac: HMAC },
      select: { orcidHmac: true },
    });
    expect(JSON.stringify(mocks.findUnique.mock.calls)).not.toContain(ORCID);
  });

  it("is false for an iD with no row", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(isOrcidPreviewSuppressed(ORCID)).resolves.toBe(false);
  });

  it("still honours the env list (the manual mechanism) without a DB read", async () => {
    process.env.PREVIEW_SUPPRESSED_ORCID_HMACS = HMAC;
    __resetEnvForTests();
    await expect(isOrcidPreviewSuppressed(ORCID)).resolves.toBe(true);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("is false (and skips the DB) when no key is configured, and fails soft on a DB error", async () => {
    delete process.env.PREVIEW_SUPPRESSION_KEY;
    __resetEnvForTests();
    await expect(isOrcidPreviewSuppressed(ORCID)).resolves.toBe(false);
    expect(mocks.findUnique).not.toHaveBeenCalled();

    process.env.PREVIEW_SUPPRESSION_KEY = "k".repeat(24);
    __resetEnvForTests();
    mocks.findUnique.mockRejectedValue(new Error("db down"));
    await expect(isOrcidPreviewSuppressed(ORCID)).resolves.toBe(false);
  });
});

describe("setOrcidPreviewSuppressed", () => {
  it("upserts the HMAC row with its source and invalidates the cached preview", async () => {
    mocks.upsert.mockResolvedValue({});
    await expect(setOrcidPreviewSuppressed(ORCID, true, "orcid-oauth")).resolves.toBe("set");
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { orcidHmac: HMAC },
      create: { orcidHmac: HMAC, source: "orcid-oauth" },
      update: { source: "orcid-oauth" },
    });
    expect(mocks.invalidate).toHaveBeenCalledWith(ORCID);
    expect(JSON.stringify(mocks.upsert.mock.calls)).not.toContain(ORCID);
  });

  it("deletes the row to show the preview again", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    await expect(setOrcidPreviewSuppressed(ORCID, false, "account")).resolves.toBe("cleared");
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { orcidHmac: HMAC } });
    expect(mocks.invalidate).toHaveBeenCalledWith(ORCID);
  });

  it("reports 'unavailable' without touching the DB when no key is configured", async () => {
    delete process.env.PREVIEW_SUPPRESSION_KEY;
    __resetEnvForTests();
    await expect(setOrcidPreviewSuppressed(ORCID, true, "account")).resolves.toBe("unavailable");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("propagates a write error (the caller decides what to tell the person)", async () => {
    mocks.upsert.mockRejectedValue(new Error("db down"));
    await expect(setOrcidPreviewSuppressed(ORCID, true, "account")).rejects.toThrow("db down");
  });
});
