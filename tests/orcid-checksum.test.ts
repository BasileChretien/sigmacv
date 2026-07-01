import { describe, expect, it } from "vitest";
import { isValidOrcidChecksum } from "@/lib/orcid/checksum";

describe("isValidOrcidChecksum (ISO 7064 MOD 11-2)", () => {
  it("accepts real iDs, including an X check digit", () => {
    expect(isValidOrcidChecksum("0000-0002-7483-2489")).toBe(true); // Basile
    expect(isValidOrcidChecksum("0000-0002-1825-0097")).toBe(true); // Carberry (docs)
    expect(isValidOrcidChecksum("0000-0002-1694-233X")).toBe(true); // X checksum
  });

  it("accepts a hyphen-free / lowercase-x form", () => {
    expect(isValidOrcidChecksum("0000000274832489")).toBe(true); // no hyphens
    expect(isValidOrcidChecksum("000000021694233x")).toBe(true); // no hyphens, lowercase x
  });

  it("rejects a single mistyped digit (bad check digit)", () => {
    expect(isValidOrcidChecksum("0000-0002-7483-2480")).toBe(false);
    expect(isValidOrcidChecksum("0000-0002-1825-0098")).toBe(false);
    expect(isValidOrcidChecksum("0000-0002-1694-2331")).toBe(false); // real check is X
  });

  it("rejects malformed lengths / characters", () => {
    expect(isValidOrcidChecksum("0000-0002-7483-248")).toBe(false); // too short
    expect(isValidOrcidChecksum("0000-0002-7483-24899")).toBe(false); // too long
    expect(isValidOrcidChecksum("abcd-0002-7483-2489")).toBe(false);
    expect(isValidOrcidChecksum("")).toBe(false);
  });
});
