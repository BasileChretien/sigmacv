import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/log";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined): void {
  // NODE_ENV is read at emit-time (not cached), so a plain assignment suffices.
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
  } else {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  }
}

describe("logger", () => {
  let log: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setNodeEnv(ORIGINAL_NODE_ENV);
  });

  describe("level routing", () => {
    it("routes each level to its matching console sink (dev)", () => {
      setNodeEnv("development");
      logger.info("evt.info");
      logger.warn("evt.warn");
      logger.error("evt.error");

      expect(log).toHaveBeenCalledWith("[info] evt.info", "");
      expect(warn).toHaveBeenCalledWith("[warn] evt.warn", "");
      expect(error).toHaveBeenCalledWith("[error] evt.error", "");
    });

    it("routes each level to its matching console sink (prod)", () => {
      setNodeEnv("production");
      logger.info("evt.info");
      logger.warn("evt.warn");
      logger.error("evt.error");

      expect(log).toHaveBeenCalledWith('{"level":"info","event":"evt.info"}');
      expect(warn).toHaveBeenCalledWith('{"level":"warn","event":"evt.warn"}');
      expect(error).toHaveBeenCalledWith('{"level":"error","event":"evt.error"}');
    });
  });

  describe("development formatting", () => {
    it("passes safe fields object as a second arg", () => {
      setNodeEnv("development");
      logger.info("evt", { count: 3, status: "ok" });
      expect(log).toHaveBeenCalledWith("[info] evt", { count: 3, status: "ok" });
    });
  });

  describe("production formatting", () => {
    it("emits a single JSON line merging level, event and fields", () => {
      setNodeEnv("production");
      logger.warn("openalex.works_truncated", { maxPages: 5, fetched: 200 });
      expect(warn).toHaveBeenCalledWith(
        '{"level":"warn","event":"openalex.works_truncated","maxPages":5,"fetched":200}',
      );
    });

    it("falls back to a marker line when fields are unserialisable", () => {
      setNodeEnv("production");
      // A BigInt passes through serialize() but JSON.stringify rejects it.
      logger.error("evt.bad", { big: 10n });
      expect(error).toHaveBeenCalledWith(
        '{"level":"error","event":"evt.bad","_fieldsError":"unserialisable"}',
      );
    });

    it("truncates over-long lines with an ellipsis", () => {
      setNodeEnv("production");
      logger.info("evt.big", { blob: "x".repeat(5000) });
      const line = log.mock.calls[0]?.[0] as string;
      expect(line.length).toBe(4001); // 4000 chars + the ellipsis
      expect(line.endsWith("…")).toBe(true);
    });
  });

  describe("redaction", () => {
    it("redacts sensitive field keys (dev)", () => {
      setNodeEnv("development");
      logger.info("evt", {
        token: "abc",
        secret: "xyz",
        password: "pw",
        authorization: "Bearer z",
        cookie: "c",
        database_url: "postgres://...",
        email: "a@b.com",
        orcid: "0000-0002-7483-2489",
        count: 7,
      });
      expect(log).toHaveBeenCalledWith("[info] evt", {
        token: "[redacted]",
        secret: "[redacted]",
        password: "[redacted]",
        authorization: "[redacted]",
        cookie: "[redacted]",
        database_url: "[redacted]",
        email: "[redacted]",
        orcid: "[redacted]",
        count: 7,
      });
    });

    it("matches sensitive substrings case-insensitively", () => {
      setNodeEnv("production");
      logger.info("evt", { userEmail: "a@b.com", AccessToken: "t" });
      expect(log).toHaveBeenCalledWith(
        '{"level":"info","event":"evt","userEmail":"[redacted]","AccessToken":"[redacted]"}',
      );
    });

    it("redacts sensitive keys nested under benign ones (recursive)", () => {
      setNodeEnv("production");
      logger.error("http.failed", {
        request: { headers: { authorization: "Bearer SUPERSECRET" }, url: "/x" },
      });
      const line = error.mock.calls[0]?.[0] as string;
      expect(line).not.toContain("SUPERSECRET");
      expect(line).toContain('"authorization":"[redacted]"');
      expect(line).toContain('"url":"/x"'); // benign nested value preserved
    });

    it("redacts sensitive keys inside arrays of objects", () => {
      setNodeEnv("production");
      logger.info("evt.arr", { items: [{ token: "t1" }, { ok: true }] });
      const line = log.mock.calls[0]?.[0] as string;
      expect(line).not.toContain("t1");
      expect(line).toContain('"token":"[redacted]"');
      expect(line).toContain('"ok":true');
    });

    it("depth-caps deeply nested / circular structures instead of looping", () => {
      setNodeEnv("development");
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      logger.info("evt.deep", { circular });
      const arg = log.mock.calls[0]?.[1];
      expect(JSON.stringify(arg)).toContain("[depth-limit]");
    });
  });

  describe("Error serialization", () => {
    it("reduces an Error to {name, message} only (no stack)", () => {
      setNodeEnv("production");
      const err = new TypeError("boom at https://pub.orcid.org/secret?x=1");
      logger.error("evt.err", { err });
      expect(error).toHaveBeenCalledWith(
        '{"level":"error","event":"evt.err","err":{"name":"TypeError","message":"boom at https://pub.orcid.org/secret?x=1"}}',
      );
    });

    it("leaves non-Error values untouched", () => {
      setNodeEnv("production");
      logger.info("evt", { n: 1, s: "x", b: true, nil: null });
      expect(log).toHaveBeenCalledWith(
        '{"level":"info","event":"evt","n":1,"s":"x","b":true,"nil":null}',
      );
    });
  });
});
