import { describe, expect, it } from "vitest";
import { normalizeOrcid, shortId } from "@/lib/openalex/types";

describe("shortId", () => {
  it("extracts the id segment from a URL", () => {
    expect(shortId("https://openalex.org/A5001069481")).toBe("A5001069481");
  });
  it("trims trailing slashes", () => {
    expect(shortId("https://openalex.org/W123/")).toBe("W123");
  });
  it("returns the input when there is no slash", () => {
    expect(shortId("A999")).toBe("A999");
  });
  it("returns empty string for null/empty", () => {
    expect(shortId(null)).toBe("");
    expect(shortId("")).toBe("");
  });
});

describe("normalizeOrcid", () => {
  it("strips the URL form to the bare iD", () => {
    expect(normalizeOrcid("https://orcid.org/0000-0002-7483-2489")).toBe("0000-0002-7483-2489");
  });
  it("uppercases an X check digit", () => {
    expect(normalizeOrcid("0000-0002-1825-009x")).toBe("0000-0002-1825-009X");
  });
  it("falls back to trimmed input when no iD pattern matches", () => {
    expect(normalizeOrcid("  not-an-orcid  ")).toBe("not-an-orcid");
  });
  it("returns empty string for null/empty", () => {
    expect(normalizeOrcid(null)).toBe("");
    expect(normalizeOrcid("")).toBe("");
  });
});
