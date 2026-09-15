import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FUNDER_REPOSITORIES,
  funderRepository,
  HAL,
  isHalFamily,
  NATIONAL_REPOSITORIES,
  nationalRepository,
  NON_DEPOSIT_SOURCES,
  ownerDepositRepositories,
  placeFitsLocations,
  placeKindOf,
  ZENODO,
  type PlaceKind,
} from "@/lib/archiving/repositoryDirectory";
import type { RepositorySource } from "@/lib/openalex/repositories";

/**
 * The committed tables behind the deposit routes, and the reduction of the
 * repositories an owner's works sit in to the places worth offering. Data, never
 * scraped; every destination linked on its own domain; an unconfirmed destination
 * recorded but never routed to.
 */

const NOTE = readFileSync(join(__dirname, "..", "docs", "DEPOSIT-ROUTES.md"), "utf8");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const source = (over: Partial<RepositorySource>): RepositorySource => ({
  sourceId: "S1",
  name: "A repository",
  homepageUrl: "https://repo.example.org",
  works: 5,
  ...over,
});

describe("ownerDepositRepositories", () => {
  it("drops indexes and data platforms, merges HAL portals into HAL, and keeps the most used first", () => {
    const out = ownerDepositRepositories([
      source({ sourceId: "S4306525036", name: "PubMed", works: 85 }),
      source({
        sourceId: "S4306402512",
        name: "HAL (CCSD)",
        homepageUrl: "https://hal.science",
        works: 34,
      }),
      source({ sourceId: "S4377196282", name: "Figshare", works: 31 }),
      source({
        sourceId: "S4306400562",
        name: "Zenodo (CERN)",
        homepageUrl: "https://zenodo.org",
        works: 8,
      }),
      source({
        sourceId: "S4406922276",
        name: "INRIA a CCSD electronic archive server",
        homepageUrl: "http://hal.inria.fr/",
        works: 6,
      }),
      source({
        sourceId: "S4406922393",
        name: "HAL AMU",
        homepageUrl: "https://hal-amu.archives-ouvertes.fr/",
        works: 1,
      }),
      source({
        sourceId: "S4306401454",
        name: " Kyoto University Research Information Repository ",
        homepageUrl: "https://repository.kulib.kyoto-u.ac.jp",
        works: 3,
      }),
    ]);
    expect(out).toEqual([
      { sourceId: "S4306402512", name: "HAL", url: HAL.href },
      { sourceId: "S4306400562", name: "Zenodo", url: ZENODO.href },
      {
        sourceId: "S4306401454",
        name: "Kyoto University Research Information Repository",
        url: "https://repository.kulib.kyoto-u.ac.jp",
      },
    ]);
  });

  it("links arXiv's submission form, keeps an https homepage otherwise, and drops a place with no https link or no name", () => {
    expect(
      ownerDepositRepositories([
        source({
          sourceId: "S4306400194",
          name: "arXiv (Cornell)",
          homepageUrl: "https://arxiv.org",
        }),
        source({ sourceId: "S2", homepageUrl: undefined }),
        source({
          sourceId: "S5",
          name: "Plain-http repository",
          homepageUrl: "http://repo.example.org",
        }),
        source({ sourceId: "S3", name: "   " }),
        source({ sourceId: "S4", name: "x".repeat(301) }),
      ]),
    ).toEqual([{ sourceId: "S4306400194", name: "arXiv", url: "https://arxiv.org/submit" }]);
  });

  it("needs at least two works in a repository and keeps at most three places", () => {
    expect(ownerDepositRepositories([source({ works: 1 })])).toEqual([]);
    const many = [5, 9, 7, 6].map((works, i) =>
      source({ sourceId: `S${10 + i}`, name: `R${i}`, works }),
    );
    expect(ownerDepositRepositories(many).map((r) => r.name)).toEqual(["R1", "R2", "R3"]);
  });
});

describe("isHalFamily", () => {
  it("recognises HAL and its portals by id or homepage, and nothing else", () => {
    expect(isHalFamily({ sourceId: "S4306402512" })).toBe(true);
    for (const homepageUrl of [
      "https://hal.science",
      "https://portal.hal.science/",
      "http://hal.inria.fr/",
      "https://hal-amu.archives-ouvertes.fr/",
      "https://archives-ouvertes.fr",
    ]) {
      expect(isHalFamily({ sourceId: "S1", homepageUrl }), homepageUrl).toBe(true);
    }
    for (const homepageUrl of [
      undefined,
      "not a url",
      "https://halifax.example.org",
      "https://zenodo.org",
    ]) {
      expect(isHalFamily({ sourceId: "S1", homepageUrl }), String(homepageUrl)).toBe(false);
    }
  });
});

describe("the destination tables", () => {
  it("lists non-deposit sources as unique OpenAlex source ids, each named in the maintainer note", () => {
    expect(NON_DEPOSIT_SOURCES.size).toBeGreaterThanOrEqual(15);
    for (const [id, name] of NON_DEPOSIT_SOURCES) {
      expect(id).toMatch(/^S\d{1,20}$/);
      expect(name.trim().length).toBeGreaterThan(0);
      expect(NOTE, id).toContain(`\`${id}\``);
    }
  });

  it("links every destination over https, on its own domain, and lists it in the note", () => {
    expect(new URL(HAL.href).hostname).toBe("hal.science");
    expect(new URL(ZENODO.href).hostname).toBe("zenodo.org");
    for (const n of NATIONAL_REPOSITORIES) {
      expect(n.countryCode).toMatch(/^[A-Z]{2}$/);
      expect(new URL(n.sourceUrl).protocol).toBe("https:");
      expect(NOTE).toContain(`| \`${n.countryCode}\` |`);
    }
    // The destination on the repository's own domain; the page it was confirmed on,
    // on the funder's domain or the repository's.
    const DOMAINS: Record<string, { destination: string; source: string[] }> = {
      "10.13039/100000002": { destination: "nih.gov", source: ["nih.gov"] },
      "10.13039/100010269": {
        destination: "europepmc.org",
        source: ["wellcome.org", "europepmc.org"],
      },
    };
    for (const f of FUNDER_REPOSITORIES) {
      expect(f.fundrefDoi).toMatch(/^10\.13039\/\d+$/);
      const domains = DOMAINS[f.fundrefDoi]!;
      const destination = new URL(f.destination.href);
      expect(destination.protocol).toBe("https:");
      expect(destination.hostname.endsWith(domains.destination), f.destination.href).toBe(true);
      const source = new URL(f.sourceUrl);
      expect(source.protocol).toBe("https:");
      expect(
        domains.source.some((d) => source.hostname.endsWith(d)),
        f.sourceUrl,
      ).toBe(true);
      const row = NOTE.split("\n").find((l) => l.startsWith(`| \`${f.fundrefDoi}\` |`));
      expect(row, f.fundrefDoi).toBeDefined();
      expect(row!.includes("**pending**")).toBe(f.verifiedBy === "maintainer-pending");
    }
  });

  it("dates exactly the confirmed entries", () => {
    for (const entry of [...NATIONAL_REPOSITORIES, ...FUNDER_REPOSITORIES]) {
      if (entry.verifiedBy === "maintainer") {
        expect(entry.lastVerified).toMatch(ISO_DATE);
      } else {
        expect("lastVerified" in entry).toBe(false);
      }
    }
  });

  it("answers only confirmed entries, case-insensitively", () => {
    expect(nationalRepository("fr")?.destination).toBe(HAL);
    expect(nationalRepository("JP")).toBeUndefined();
    expect(nationalRepository(undefined)).toBeUndefined();
    expect(funderRepository("10.13039/100000002".toUpperCase())?.destination.name).toBe(
      "PubMed Central (NIHMS)",
    );
    expect(funderRepository("10.13039/100010269")?.destination.name).toBe("Europe PMC plus");
    // An entry nobody has confirmed is never an action.
    for (const pending of FUNDER_REPOSITORIES.filter((f) => f.verifiedBy !== "maintainer")) {
      expect(funderRepository(pending.fundrefDoi), pending.fundrefDoi).toBeUndefined();
    }
    expect(funderRepository("10.13039/999999999")).toBeUndefined();
    expect(funderRepository(undefined)).toBeUndefined();
  });
});

describe("placeFitsLocations", () => {
  const fits = (kind: PlaceKind, ...locations: string[]) => placeFitsLocations(kind, locations);

  it("names each destination link's kind of place", () => {
    expect(placeKindOf(HAL.href)).toBe("hal");
    expect(placeKindOf(ZENODO.href)).toBe("zenodo");
    expect(placeKindOf("https://arxiv.org/submit")).toBe("arxiv");
    expect(placeKindOf("https://repository.example.org")).toBe("other");
  });

  it("lets every place fit no constraint, any repository or any website — and nothing else by default", () => {
    for (const kind of ["hal", "zenodo", "arxiv", "other"] as const) {
      expect(fits(kind), kind).toBe(true);
      expect(fits(kind, "Any Repository"), kind).toBe(true);
      expect(fits(kind, "Author's Homepage", "Any Website"), kind).toBe(true);
      expect(fits(kind, "Author's Homepage"), kind).toBe(false);
    }
  });

  it("reads HAL as institutional and non-commercial, Zenodo as non-commercial and general, arXiv as a subject repository", () => {
    expect(fits("hal", "Institutional Repository")).toBe(true);
    expect(fits("hal", "Non-commercial Subject Repository")).toBe(true);
    expect(fits("hal", "Subject Repository")).toBe(false);
    expect(fits("zenodo", "Non-Commercial Repository")).toBe(true);
    expect(fits("zenodo", "General Repository")).toBe(true);
    expect(fits("zenodo", "Institutional Repository")).toBe(false);
    expect(fits("zenodo", "Non-commercial Subject Repository")).toBe(false);
    expect(fits("arxiv", "Non-commercial Subject Repository")).toBe(true);
    expect(fits("arxiv", "Preprint Server")).toBe(true);
    expect(fits("arxiv", "Institutional Repository")).toBe(false);
    expect(fits("other", "Institutional Repository")).toBe(false);
  });

  it("never offers a preprint server as the place a published paper goes", () => {
    expect(
      ownerDepositRepositories([
        source({ sourceId: "S3005729997", name: "medRxiv", works: 9 }),
        source({ sourceId: "S4306402567", name: "bioRxiv", works: 5 }),
        source({ sourceId: "S4210172589", name: "SSRN Electronic Journal", works: 4 }),
      ]),
    ).toEqual([]);
  });
});
