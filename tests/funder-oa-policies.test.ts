import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FUNDER_OA_POLICIES, funderOaPolicy } from "@/lib/funders/oaPolicies";

/**
 * The funder open-access policy table: committed, hand-verified DATA keyed by
 * FundRef DOI — never scraped, never inferred. Every entry links the policy on
 * the funder's OWN domain and says when it was last checked; the sentences
 * built from it are facts side by side, so the vocabulary of a verdict is
 * banned outright (the panel's "Compliance verdicts" veto).
 */

const FORBIDDEN = ["compliant", "non-compliant", "overdue", "mandate"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FUNDREF = /^10\.13039\/\d+$/;

/** The domain each funder's policy must live on — the funder's own. */
const OWN_DOMAIN: Record<string, string> = {
  "10.13039/100014013": "ukri.org",
  "10.13039/100010269": "wellcome.org",
  "10.13039/100000002": "nih.gov",
  "10.13039/100000001": "nsf.gov",
  "10.13039/501100000781": "erc.europa.eu",
  "10.13039/501100000780": "ec.europa.eu",
  "10.13039/501100001665": "anr.fr",
  "10.13039/100000865": "gatesfoundation.org",
  "10.13039/501100002428": "fwf.ac.at",
  "10.13039/501100003246": "nwo.nl",
};

const NOTE = readFileSync(join(__dirname, "..", "docs", "FUNDER-OA-POLICIES.md"), "utf8");

describe("FUNDER_OA_POLICIES", () => {
  it("has the expected entries, each keyed by a unique FundRef DOI", () => {
    const dois = FUNDER_OA_POLICIES.map((p) => p.fundrefDoi);
    expect(new Set(dois).size).toBe(dois.length);
    expect(dois.sort()).toEqual(Object.keys(OWN_DOMAIN).sort());
    for (const doi of dois) expect(doi).toMatch(FUNDREF);
  });

  it.each(FUNDER_OA_POLICIES.map((p) => [p.name, p] as const))(
    "%s: policy URL on the funder's own domain (https), dated verification, short factual statements",
    (_name, p) => {
      const url = new URL(p.policyUrl);
      expect(url.protocol).toBe("https:");
      const domain = OWN_DOMAIN[p.fundrefDoi]!;
      expect(url.hostname === domain || url.hostname.endsWith(`.${domain}`), url.hostname).toBe(
        true,
      );
      expect(p.name.trim().length).toBeGreaterThan(0);
      expect(["maintainer", "maintainer-pending"]).toContain(p.verifiedBy);
      if (p.effectiveFrom !== undefined) expect(p.effectiveFrom).toMatch(ISO_DATE);
      expect(p.statements.length).toBeGreaterThanOrEqual(1);
      expect(p.statements.length).toBeLessThanOrEqual(8);
      for (const s of p.statements) {
        expect(s.trim()).toBe(s);
        expect(s.length).toBeGreaterThan(0);
        expect(s.length).toBeLessThanOrEqual(160);
      }
    },
  );

  it("carries a verification date exactly when a maintainer confirmed the entry live — a pending entry has none", () => {
    // The owner sentence says "as recorded on <date>" ONLY for a confirmed
    // entry; a pending one is worded "drafted from memory and not yet
    // confirmed", so a date on it would be a check that never happened.
    for (const p of FUNDER_OA_POLICIES) {
      const raw = p as unknown as Record<string, unknown>;
      if (p.verifiedBy === "maintainer") {
        expect(p.lastVerified, p.name).toMatch(ISO_DATE);
        expect(Date.parse(p.lastVerified)).toBeLessThanOrEqual(Date.now());
      } else {
        expect(p.verifiedBy).toBe("maintainer-pending");
        expect("lastVerified" in raw, `${p.name} is pending but carries lastVerified`).toBe(false);
      }
    }
  });

  it("never uses the vocabulary of a verdict, in any field", () => {
    for (const p of FUNDER_OA_POLICIES) {
      const text = [p.name, p.policyUrl, ...p.statements].join(" ").toLowerCase();
      for (const word of FORBIDDEN) {
        expect(text.includes(word), `${p.name} contains "${word}"`).toBe(false);
      }
    }
  });

  it("lists every entry still awaiting live confirmation in the maintainer note", () => {
    for (const p of FUNDER_OA_POLICIES) {
      if (p.verifiedBy !== "maintainer-pending") continue;
      expect(NOTE, `${p.name} missing from docs/FUNDER-OA-POLICIES.md`).toContain(p.fundrefDoi);
      expect(NOTE).toContain(p.policyUrl);
    }
  });

  it("keeps the maintainer note free of the same vocabulary", () => {
    const text = NOTE.toLowerCase();
    // The note may name the banned words once, in the sentence that bans them.
    const banLine = text.split("\n").find((l) => l.includes("never") && l.includes("compliant"));
    const rest = text.replace(banLine ?? "", "");
    for (const word of FORBIDDEN) expect(rest.includes(word), word).toBe(false);
  });
});

describe("funderOaPolicy", () => {
  it("looks a policy up by FundRef DOI, case-insensitively, and answers undefined otherwise", () => {
    expect(funderOaPolicy("10.13039/100014013")?.name).toMatch(/UKRI/);
    expect(funderOaPolicy("10.13039/100014013".toUpperCase())?.name).toMatch(/UKRI/);
    expect(funderOaPolicy("10.13039/999999999")).toBeUndefined();
    expect(funderOaPolicy(undefined)).toBeUndefined();
    expect(funderOaPolicy("")).toBeUndefined();
  });

  it("carries the statements the panel joins, with an effective date only where the funder states one", () => {
    const nih = funderOaPolicy("10.13039/100000002")!;
    expect(nih.effectiveFrom).toBe("2025-07-01");
    expect(nih.statements.join(" ")).toMatch(/PubMed Central/);
    expect(nih.policyUrl).toBe("https://sharing.nih.gov/public-access-policy");
    // ERC scopes its policy by call, not by date: the call is in the
    // statements and no January-1 proxy is invented.
    const erc = funderOaPolicy("10.13039/501100000781")!;
    expect(erc.effectiveFrom).toBeUndefined();
    expect(erc.statements.join(" ")).toMatch(/2021 calls/);
  });
});
