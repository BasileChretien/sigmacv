import { describe, expect, it } from "vitest";
import { validOrcidOrNull } from "@/lib/orcid/validate";

describe("validOrcidOrNull", () => {
  it("canonicalises any well-formed, checksum-valid form to the bare iD", () => {
    expect(validOrcidOrNull("0000-0002-7483-2489")).toBe("0000-0002-7483-2489");
    expect(validOrcidOrNull("https://orcid.org/0000-0002-7483-2489")).toBe("0000-0002-7483-2489");
    expect(validOrcidOrNull("  0000-0001-7580-4351 ")).toBe("0000-0001-7580-4351");
    expect(validOrcidOrNull("0000-0002-1825-0097")).toBe("0000-0002-1825-0097");
  });

  it("rejects a typo (well-formed but wrong check digit)", () => {
    expect(validOrcidOrNull("0000-0002-7483-2480")).toBeNull();
  });

  it("rejects anything that is not an iD — never passes raw input through", () => {
    // `normalizeOrcid` returns its input unchanged when no iD is present; this
    // helper must not, because callers interpolate the result into SPARQL / URLs.
    expect(validOrcidOrNull('"> } UNION { ?x ?y ?z')).toBeNull();
    expect(validOrcidOrNull("")).toBeNull();
    expect(validOrcidOrNull(null)).toBeNull();
    expect(validOrcidOrNull(undefined)).toBeNull();
    expect(validOrcidOrNull("not-an-orcid")).toBeNull();
  });
});
