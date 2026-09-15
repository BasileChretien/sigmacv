import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STATUTORY_ARCHIVING,
  STATUTORY_KINDS,
  statutoryArchivingFor,
} from "@/lib/archiving/statutoryRights";

/**
 * The statutory self-archiving table: committed, hand-verified DATA keyed by
 * country — never scraped, never inferred. Every entry names its instrument and
 * where its text was read, and says when; the sentence built from it "may also
 * apply" beside the publisher's and the funder's policies, so the vocabulary of a
 * verdict or a quantity is banned outright.
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

/** Where each country's text must live. */
const SOURCE_DOMAIN: Record<string, string> = {
  FR: "legifrance.gouv.fr",
  DE: "gesetze-im-internet.de",
  AT: "jusline.at",
  NL: "wetten.overheid.nl",
  BE: "kuleuven.be",
  ES: "boe.es",
  IT: "normattiva.it",
  JP: "kyushu-u.ac.jp",
};
const GUIDANCE_DOMAIN: Record<string, string> = {
  FR: "ouvrirlascience.fr",
  NL: "openaccess.nl",
};

const NOTE = readFileSync(join(__dirname, "..", "docs", "STATUTORY-ARCHIVING-RIGHTS.md"), "utf8");

function onDomain(raw: string, domain: string): boolean {
  const url = new URL(raw);
  return (
    url.protocol === "https:" && (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  );
}

describe("STATUTORY_ARCHIVING", () => {
  it("has the expected countries, each once, as upper-case ISO codes", () => {
    const codes = STATUTORY_ARCHIVING.map((e) => e.countryCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual(Object.keys(SOURCE_DOMAIN).sort());
    for (const code of codes) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it.each(STATUTORY_ARCHIVING.map((e) => [e.countryCode, e] as const))(
    "%s: https source on the expected domain, a known kind, a named instrument, short factual statements",
    (code, e) => {
      expect(onDomain(e.sourceUrl, SOURCE_DOMAIN[code]!), e.sourceUrl).toBe(true);
      if (e.guidanceUrl !== undefined) {
        expect(GUIDANCE_DOMAIN[code], `${code} has an unexpected guidance page`).toBeDefined();
        expect(onDomain(e.guidanceUrl, GUIDANCE_DOMAIN[code]!), e.guidanceUrl).toBe(true);
      }
      expect(STATUTORY_KINDS).toContain(e.kind);
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
      const entry = STATUTORY_ARCHIVING.find((e) => e.countryCode === code);
      expect(entry?.guidanceUrl, code).toBeDefined();
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

  it("words Spain as a requirement, never an optional right, and Italy as having no author right", () => {
    const es = STATUTORY_ARCHIVING.find((e) => e.countryCode === "ES")!;
    expect(es.kind).toBe("deposit-requirement");
    expect(es.statements.join(" ")).toMatch(/not an optional right/);
    expect(STATUTORY_ARCHIVING.find((e) => e.countryCode === "IT")!.kind).toBe("no-author-right");
    expect(STATUTORY_ARCHIVING.find((e) => e.countryCode === "JP")!.kind).toBe("funding-policy");
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
  it("returns one entry per known country, in the stored order, case-insensitively", () => {
    expect(
      statutoryArchivingFor(["jp", "FR", "fr", "US", " de "]).map((e) => e.countryCode),
    ).toEqual(["JP", "FR", "DE"]);
  });

  it("is empty for unknown countries and for no countries", () => {
    expect(statutoryArchivingFor(["US", "GB"])).toEqual([]);
    expect(statutoryArchivingFor([])).toEqual([]);
    expect(statutoryArchivingFor(undefined)).toEqual([]);
  });
});
