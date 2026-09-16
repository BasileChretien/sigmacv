import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STATUTORY_ARCHIVING,
  STATUTORY_KINDS,
  STATUTORY_SOURCE_KINDS,
  statutoryArchivingFor,
} from "@/lib/archiving/statutoryRights";

/**
 * The statutory self-archiving table: committed, hand-verified DATA keyed by
 * country — never scraped, never inferred. Every entry names its instrument and
 * where it was read, and says when; the sentence built from it "may also apply"
 * beside the publisher's and the funder's policies, so the vocabulary of a
 * verdict or a quantity is banned outright, and a rule the work's year or type
 * already rules out is never offered.
 */

const FORBIDDEN = [
  "compliant",
  "compliance",
  "overdue",
  "violation",
  "mandate",
  "mandatory",
  "percent",
  "%",
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Where each country's rule must be read, and what that page is. */
const SOURCE: Record<string, { domain: string; kind: string }> = {
  FR: { domain: "legifrance.gouv.fr", kind: "legal-text" },
  DE: { domain: "gesetze-im-internet.de", kind: "legal-text" },
  AT: { domain: "jusline.at", kind: "legal-text" },
  NL: { domain: "wetten.overheid.nl", kind: "legal-text" },
  BE: { domain: "ejustice.just.fgov.be", kind: "legal-text" },
  BG: { domain: "dv.parliament.bg", kind: "legal-text" },
  ES: { domain: "boe.es", kind: "legal-text" },
  JP: { domain: "cao.go.jp", kind: "policy-text" },
};
const GUIDANCE_DOMAIN: Record<string, string> = {
  FR: "ouvrirlascience.fr",
  DE: "irights.info",
  NL: "openaccess.nl",
  BE: "kuleuven.be",
  JP: "cao.go.jp",
};

const NOTE = readFileSync(join(__dirname, "..", "docs", "STATUTORY-ARCHIVING-RIGHTS.md"), "utf8");

function onDomain(raw: string, domain: string): boolean {
  const url = new URL(raw);
  return (
    url.protocol === "https:" && (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  );
}

const entry = (code: string) => STATUTORY_ARCHIVING.find((e) => e.countryCode === code)!;

describe("STATUTORY_ARCHIVING", () => {
  it("has the expected countries, each once, as upper-case ISO codes", () => {
    const codes = STATUTORY_ARCHIVING.map((e) => e.countryCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual(Object.keys(SOURCE).sort());
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it.each(STATUTORY_ARCHIVING.map((e) => [e.countryCode, e] as const))(
    "%s: https source on the expected domain and of the expected kind, a named instrument, short factual statements",
    (code, e) => {
      expect(onDomain(e.sourceUrl, SOURCE[code]!.domain), e.sourceUrl).toBe(true);
      expect(e.sourceKind).toBe(SOURCE[code]!.kind);
      expect(STATUTORY_SOURCE_KINDS).toContain(e.sourceKind);
      if (e.guidanceUrl !== undefined) {
        expect(GUIDANCE_DOMAIN[code], `${code} has an unexpected guidance page`).toBeDefined();
        expect(onDomain(e.guidanceUrl, GUIDANCE_DOMAIN[code]!), e.guidanceUrl).toBe(true);
      }
      expect(STATUTORY_KINDS).toContain(e.kind);
      if (e.appliesFrom !== undefined) expect(e.appliesFrom).toMatch(ISO_DATE);
      if (e.workTypes !== undefined) {
        expect(e.workTypes.length).toBeGreaterThan(0);
        for (const t of e.workTypes) expect(t).toMatch(/^[a-z-]+$/);
      }
      expect(e.instrument.trim()).toBe(e.instrument);
      expect(e.instrument.length).toBeGreaterThan(0);
      expect(e.instrument.length).toBeLessThanOrEqual(160);
      expect(e.statements.length).toBeGreaterThanOrEqual(1);
      expect(e.statements.length).toBeLessThanOrEqual(8);
      for (const s of e.statements) {
        expect(s.trim()).toBe(s);
        expect(s.length).toBeGreaterThan(0);
        expect(s.length, s).toBeLessThanOrEqual(160);
      }
    },
  );

  it("names every guidance page it expects", () => {
    for (const code of Object.keys(GUIDANCE_DOMAIN)) {
      expect(entry(code).guidanceUrl, code).toBeDefined();
    }
  });

  it("carries a verification date exactly when a maintainer read the text — a pending entry has none", () => {
    for (const e of STATUTORY_ARCHIVING) {
      const raw = e as unknown as Record<string, unknown>;
      if (e.verifiedBy === "maintainer") {
        expect(e.lastVerified, e.countryCode).toMatch(ISO_DATE);
        expect(Date.parse(e.lastVerified)).toBeLessThanOrEqual(Date.now());
      } else {
        expect(e.verifiedBy).toBe("maintainer-pending");
        expect("lastVerified" in raw, `${e.countryCode} is pending but dated`).toBe(false);
      }
    }
  });

  it("never uses the vocabulary of a verdict or a quantity in an instrument or a statement", () => {
    for (const e of STATUTORY_ARCHIVING) {
      const text = [e.instrument, ...e.statements].join(" ").toLowerCase();
      for (const word of FORBIDDEN) {
        expect(text.includes(word), `${e.countryCode} contains "${word}"`).toBe(false);
      }
    }
  });

  it("lists only rules that give the author something — never a country's absence of one", () => {
    expect([...STATUTORY_KINDS]).toEqual(["author-right", "deposit-requirement", "funding-policy"]);
    for (const e of STATUTORY_ARCHIVING) {
      expect(e.statements.join(" "), e.countryCode).not.toMatch(/\bno statutory right\b/i);
    }
  });

  it("words Spain as a requirement in force from September 2022, and Japan as a policy for the FY2025 calls", () => {
    const es = entry("ES");
    expect(es.kind).toBe("deposit-requirement");
    expect(es.statements.join(" ")).toMatch(/not an optional right/);
    expect(es.appliesFrom).toBe("2022-09-07");
    const jp = entry("JP");
    expect(jp.kind).toBe("funding-policy");
    expect(jp.appliesFrom).toBe("2025-04-01");
    expect(jp.statements.join(" ")).toMatch(/FY2025/);
  });

  it("keys Austria on the institution's funding and the author's staff status, not on the research", () => {
    const at = entry("AT").statements.join(" ");
    expect(at).toMatch(/member of the academic staff of a research institution/);
    expect(at).not.toMatch(/from research at least half funded/);
  });

  it("keys Bulgaria on scientific literature from 2021 on — earlier contracts stand — and reads Belgium in the Code itself", () => {
    const bg = entry("BG");
    expect(bg.kind).toBe("author-right");
    expect(bg.appliesFrom).toBe("2021-06-07");
    // Germany and Austria: the right exists from its entry into force; whether it
    // reaches earlier works is disputed (DE) or unaddressed (AT), so the line is
    // not printed under them.
    expect(entry("DE").appliesFrom).toBe("2014-01-01");
    expect(entry("AT").appliesFrom).toBe("2015-10-01");
    expect(bg.workTypes).toContain("chapter");
    expect(bg.workTypes).not.toContain("dataset");
    expect(bg.statements.join(" ")).toMatch(/not to contracts concluded or rights acquired before/);
    expect(bg.statements.join(" ")).toMatch(/publisher must be mentioned/);
    const be = entry("BE");
    expect(be.sourceKind).toBe("legal-text");
    expect(be.appliesFrom).toBeUndefined();
    // The Code says "le manuscrit" and "fonds publics" — nothing about a version or origin.
    expect(be.statements.join(" ")).not.toMatch(/accepted version|domestic or foreign/);
  });

  it("lists every entry, with its source, in the maintainer note — pending ones marked", () => {
    for (const e of STATUTORY_ARCHIVING) {
      expect(NOTE, `${e.countryCode} missing from the note`).toContain(`| \`${e.countryCode}\` |`);
      expect(NOTE).toContain(e.sourceUrl);
      const row = NOTE.split("\n").find((l) => l.startsWith(`| \`${e.countryCode}\` |`))!;
      expect(row.includes("**pending**"), `${e.countryCode} status in the note`).toBe(
        e.verifiedBy === "maintainer-pending",
      );
    }
  });

  it("keeps the maintainer note's prose free of the same vocabulary (URLs aside)", () => {
    const prose = NOTE.replace(/https?:\/\/\S+/g, "").toLowerCase();
    // The note may name the banned words once, in the sentence that bans them.
    const banLine = prose.split("\n").find((l) => l.includes("never") && l.includes("compliant"));
    const rest = prose.replace(banLine ?? "", "");
    for (const word of FORBIDDEN) expect(rest.includes(word), word).toBe(false);
  });
});

describe("statutoryArchivingFor", () => {
  const codes = (list: ReturnType<typeof statutoryArchivingFor>) => list.map((e) => e.countryCode);

  it("returns one entry per known country, in the stored order, case-insensitively", () => {
    expect(
      codes(
        statutoryArchivingFor(["jp", "FR", "fr", "US", " de "], {
          year: 2025,
          type: "article-journal",
        }),
      ),
    ).toEqual(["JP", "FR", "DE"]);
  });

  it("is empty for unknown countries and for no countries", () => {
    expect(statutoryArchivingFor(["US", "GB"])).toEqual([]);
    expect(statutoryArchivingFor([])).toEqual([]);
    expect(statutoryArchivingFor(undefined)).toEqual([]);
  });

  it("leaves out a rule that started after the work's year, and keeps it from the start year or with no year", () => {
    const article = { type: "article-journal" };
    expect(codes(statutoryArchivingFor(["ES", "JP"], { ...article, year: 2021 }))).toEqual([]);
    expect(codes(statutoryArchivingFor(["ES", "JP"], { ...article, year: 2022 }))).toEqual(["ES"]);
    expect(codes(statutoryArchivingFor(["ES", "JP"], { ...article, year: 2025 }))).toEqual([
      "ES",
      "JP",
    ]);
    expect(codes(statutoryArchivingFor(["ES", "JP"], article))).toEqual(["ES", "JP"]);
    // A rule with no start date is never filtered by year (Belgium is retroactive).
    expect(codes(statutoryArchivingFor(["BE"], { ...article, year: 1990 }))).toEqual(["BE"]);
    // Bulgaria leaves contracts concluded before 7 June 2021 unaffected: a 2020 work's
    // publishing contract predates it. A dataset is not scientific literature.
    expect(codes(statutoryArchivingFor(["BG"], { type: "chapter", year: 2020 }))).toEqual([]);
    expect(codes(statutoryArchivingFor(["BG"], { type: "chapter", year: 2021 }))).toEqual(["BG"]);
    expect(codes(statutoryArchivingFor(["BG"], { type: "dataset", year: 2024 }))).toEqual([]);
  });

  it("leaves out a rule that does not cover the work's type, or when the type is unknown", () => {
    expect(
      codes(statutoryArchivingFor(["FR", "NL", "ES"], { year: 2024, type: "chapter" })),
    ).toEqual(["NL", "ES"]);
    expect(codes(statutoryArchivingFor(["FR", "NL", "ES"], { year: 2024 }))).toEqual(["ES"]);
    expect(
      codes(statutoryArchivingFor(["FR", "NL"], { year: 2024, type: "article-journal" })),
    ).toEqual(["FR", "NL"]);
  });
});
