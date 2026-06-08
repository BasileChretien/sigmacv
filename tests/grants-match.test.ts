import { describe, expect, it } from "vitest";
import { matchesNameAndOrg, personMatch, tokenize } from "@/lib/grants/match";

describe("tokenize", () => {
  it("lower-cases, strips diacritics, drops particles + initials", () => {
    expect(tokenize("Basile Chrétien")).toEqual(["basile", "chretien"]);
    expect(tokenize("Ludwig van Beethoven")).toEqual(["ludwig", "beethoven"]);
    expect(tokenize("B. Chrétien")).toEqual(["chretien"]); // single-letter initial dropped
  });
});

describe("matchesNameAndOrg — never name-only", () => {
  const person = personMatch("Basile Chrétien", ["Nagoya University", "CHU de Caen Normandie"]);

  it("matches when BOTH a name and an organization match", () => {
    expect(matchesNameAndOrg(person, "Basile Chretien", "Nagoya University, Japan")).toBe(true);
    // Order-swapped name + a partial org name still match.
    expect(matchesNameAndOrg(person, "Chretien, Basile", "CHU de Caen")).toBe(true);
  });

  it("rejects a candidate with NO organization (never name-only)", () => {
    expect(matchesNameAndOrg(person, "Basile Chretien", undefined)).toBe(false);
    expect(matchesNameAndOrg(person, "Basile Chretien", "")).toBe(false);
  });

  it("rejects a bare surname collision (different given name)", () => {
    expect(matchesNameAndOrg(person, "John Chretien", "Nagoya University")).toBe(false);
  });

  it("rejects a name match at the WRONG organization", () => {
    expect(matchesNameAndOrg(person, "Basile Chretien", "Harvard University")).toBe(false);
    // A too-short org string (≤2 chars) can never match, even with a name hit.
    expect(matchesNameAndOrg(person, "Basile Chretien", "JP")).toBe(false);
  });

  it("rejects when the surname is absent from the candidate", () => {
    expect(matchesNameAndOrg(person, "Basile Dupont", "Nagoya University")).toBe(false);
  });

  it("allows a single-token (mononym) name + org", () => {
    const mono = personMatch("Madonna", ["Some Institute"]);
    expect(matchesNameAndOrg(mono, "Madonna", "Some Institute, US")).toBe(true);
    expect(matchesNameAndOrg(mono, "Madonna", undefined)).toBe(false);
  });

  it("returns false when the person has no usable surname", () => {
    const empty = personMatch("", ["Org"]);
    expect(matchesNameAndOrg(empty, "Anyone", "Org")).toBe(false);
  });
});
