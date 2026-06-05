import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";
import {
  auditSubject,
  recordCurationAudit,
} from "@/lib/openalex/curationAudit";
import { logger } from "@/lib/log";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("auditSubject", () => {
  it("never returns the raw user id", () => {
    const subject = auditSubject("user-123", "saltsaltsaltsalt");
    expect(subject).not.toContain("user-123");
    expect(subject).toHaveLength(16);
  });

  it("uses a keyed HMAC when a salt is given (matches research export convention)", () => {
    const salt = "saltsaltsaltsalt";
    const expected = createHmac("sha256", salt).update("u1").digest("hex").slice(0, 16);
    expect(auditSubject("u1", salt)).toBe(expected);
  });

  it("falls back to a plain SHA-256 prefix when no salt is configured", () => {
    delete process.env.RESEARCH_EXPORT_PSEUDONYM_SALT;
    const expected = createHash("sha256").update("u1").digest("hex").slice(0, 16);
    expect(auditSubject("u1")).toBe(expected);
  });

  it("reads the salt from RESEARCH_EXPORT_PSEUDONYM_SALT by default", () => {
    process.env.RESEARCH_EXPORT_PSEUDONYM_SALT = "envsaltenvsaltenv";
    const expected = createHmac("sha256", "envsaltenvsaltenv")
      .update("u1")
      .digest("hex")
      .slice(0, 16);
    expect(auditSubject("u1")).toBe(expected);
  });
});

describe("recordCurationAudit", () => {
  beforeEach(() => {
    delete process.env.RESEARCH_EXPORT_PSEUDONYM_SALT;
  });

  it("logs a structured audit line with subject, count and status (no raw id)", () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => {});
    const record = recordCurationAudit("user-xyz", 3, { status: "ok", submitted: 3, httpStatus: 200 });

    expect(record.assertionCount).toBe(3);
    expect(record.status).toBe("ok");
    expect(record.subject).not.toContain("user-xyz");

    expect(info).toHaveBeenCalledWith("openalex.curation_audit", {
      subject: record.subject,
      assertionCount: 3,
      status: "ok",
    });
  });

  it("records the disabled status too", () => {
    vi.spyOn(logger, "info").mockImplementation(() => {});
    const record = recordCurationAudit("u", 0, { status: "disabled" });
    expect(record.status).toBe("disabled");
    expect(record.assertionCount).toBe(0);
  });
});
