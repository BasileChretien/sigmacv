import { describe, expect, it, vi } from "vitest";

// The module also hosts the DB-backed functions (which import the Prisma client
// and read the env); the pure helpers under test need neither.
vi.mock("@/lib/db", () => ({ prisma: {} }));
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});
import {
  isPreviewSuppressed,
  parseSuppressionList,
  previewSuppressionHmac,
} from "@/lib/cv/previewSuppression";

const SECRET = "s".repeat(32);
const ORCID = "0000-0002-1825-0097";

describe("previewSuppressionHmac", () => {
  it("is deterministic, keyed by the secret, and a 64-hex digest", () => {
    const a = previewSuppressionHmac(ORCID, SECRET);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(previewSuppressionHmac(ORCID, SECRET)).toBe(a);
    expect(previewSuppressionHmac(ORCID, "other")).not.toBe(a);
    expect(previewSuppressionHmac("0000-0002-1825-0098", SECRET)).not.toBe(a);
  });

  it("hashes a lowercase x check digit and stray whitespace like the canonical form", () => {
    expect(previewSuppressionHmac(" 0000-0002-7483-248x ", SECRET)).toBe(
      previewSuppressionHmac("0000-0002-7483-248X", SECRET),
    );
  });
});

describe("parseSuppressionList", () => {
  it("returns an empty set for unset/blank input", () => {
    expect(parseSuppressionList(undefined).size).toBe(0);
    expect(parseSuppressionList("").size).toBe(0);
  });

  it("splits on commas, trims, lower-cases, and drops anything that is not a digest", () => {
    const h = previewSuppressionHmac(ORCID, SECRET);
    const list = parseSuppressionList(` ${h.toUpperCase()} , not-a-hash, ${ORCID},, ${h}`);
    expect([...list]).toEqual([h]);
  });
});

describe("isPreviewSuppressed", () => {
  it("is false for an empty list without hashing", () => {
    expect(isPreviewSuppressed(ORCID, new Set(), SECRET)).toBe(false);
  });

  it("matches a listed iD and only that iD", () => {
    const list = parseSuppressionList(previewSuppressionHmac(ORCID, SECRET));
    expect(isPreviewSuppressed(ORCID, list, SECRET)).toBe(true);
    expect(isPreviewSuppressed("0000-0002-7483-2489", list, SECRET)).toBe(false);
    // A different server secret does not recognise the same list.
    expect(isPreviewSuppressed(ORCID, list, "other")).toBe(false);
  });
});
