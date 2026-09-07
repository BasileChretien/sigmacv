import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import type { Env } from "@/lib/env";
import type { OpenAlexWork } from "@/lib/openalex/types";
import {
  buildDataciteDoiPayload,
  DATACITE_DOIS_URL,
  doiMintingEnabled,
  MAX_RELATED_WORK_DOIS,
  mintSnapshotDoi,
  snapshotDoiTitle,
  tombstoneSnapshotDoi,
  WITHDRAWN_PATH,
} from "@/lib/datacite/mint";
import { visibleWorkDois } from "@/lib/cv/publicJsonLd";
import worksFixture from "./fixtures/openalex-works.json";

vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const BASE: Env = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(40),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  ORCID_ENVIRONMENT: "sandbox",
  OPENALEX_MAILTO: "ci@example.org",
  OPENALEX_CURATION_ENABLED: false,
} as Env;

const ENABLED: Env = {
  ...BASE,
  DATACITE_REPOSITORY_ID: "SIGMA.CV",
  DATACITE_PASSWORD: "hunter2",
  DATACITE_PREFIX: "10.12345",
};

const INPUT = {
  ownerName: "Basile Chrétien",
  orcid: "0000-0002-7483-2489",
  version: 3,
  year: 2026,
  url: "https://sigmacv.test/p/basile-x/v/tok",
  previousDoi: "10.12345/prev",
};

function res(body: unknown, ok = true, status = 201): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("doiMintingEnabled", () => {
  it("is false unless ALL three DATACITE_* values are set", () => {
    expect(doiMintingEnabled(BASE)).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_PREFIX: undefined })).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_PASSWORD: undefined })).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_REPOSITORY_ID: undefined })).toBe(false);
    expect(doiMintingEnabled(ENABLED)).toBe(true);
  });
});

describe("buildDataciteDoiPayload", () => {
  it("builds the minimal findable-DOI payload with creator ORCID and IsNewVersionOf", () => {
    expect(buildDataciteDoiPayload(INPUT, "10.12345")).toEqual({
      data: {
        type: "dois",
        attributes: {
          prefix: "10.12345",
          event: "publish",
          creators: [
            {
              name: "Basile Chrétien",
              nameType: "Personal",
              nameIdentifiers: [
                {
                  nameIdentifier: "https://orcid.org/0000-0002-7483-2489",
                  nameIdentifierScheme: "ORCID",
                  schemeUri: "https://orcid.org",
                },
              ],
            },
          ],
          titles: [{ title: "Basile Chrétien — academic CV, snapshot v3" }],
          publisher: "SigmaCV",
          publicationYear: 2026,
          types: { resourceTypeGeneral: "Text", resourceType: "Curriculum vitae" },
          url: "https://sigmacv.test/p/basile-x/v/tok",
          version: "3",
          relatedIdentifiers: [
            {
              relatedIdentifier: "10.12345/prev",
              relatedIdentifierType: "DOI",
              relationType: "IsNewVersionOf",
            },
          ],
        },
      },
    });
  });

  it("omits the ORCID identifier and relatedIdentifiers when absent, and falls back to 'Researcher'", () => {
    const p = buildDataciteDoiPayload(
      { ...INPUT, orcid: undefined, previousDoi: null, ownerName: "  " },
      "10.12345",
    ) as { data: { attributes: Record<string, unknown> } };
    const creator = (p.data.attributes.creators as Record<string, unknown>[])[0]!;
    expect(creator).toEqual({ name: "Researcher", nameType: "Personal" });
    expect(p.data.attributes.relatedIdentifiers).toBeUndefined();
    expect(snapshotDoiTitle("", 1)).toBe("Researcher — academic CV, snapshot v1");
  });
});

describe("mintSnapshotDoi", () => {
  it("is a no-op (no network call) when minting is disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await mintSnapshotDoi(INPUT, BASE)).toEqual({ ok: false, reason: "disabled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to DataCite with basic auth, no retry, and returns the minted DOI", async () => {
    const fetchMock = vi.fn(async () =>
      res({ data: { id: "10.12345/ABCD", attributes: { doi: "10.12345/ABCD" } } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await mintSnapshotDoi(INPUT, ENABLED);
    expect(out).toEqual({ ok: true, doi: "10.12345/abcd" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(DATACITE_DOIS_URL);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("SIGMA.CV:hunter2").toString("base64")}`,
    );
    expect(headers["Content-Type"]).toBe("application/vnd.api+json");
    expect(headers["User-Agent"]).toContain("mailto:ci@example.org");
    const body = JSON.parse(init.body as string) as { data: { attributes: { prefix: string } } };
    expect(body.data.attributes.prefix).toBe("10.12345");
  });

  it("accepts the DOI from data.id alone (defensive parse)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { id: "10.12345/xyz" } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: true, doi: "10.12345/xyz" });
  });

  it("fails soft on a non-2xx status — and does NOT retry a 5xx (mint is not idempotent)", async () => {
    const fetchMock = vi.fn(async () => res({ errors: [{ title: "boom" }] }, false, 500));
    vi.stubGlobal("fetch", fetchMock);
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: false, reason: "http-500" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails soft when the body carries no DOI or is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { attributes: {} } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(null)),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("just a string")),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { id: "not-a-doi" } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 201,
            json: async () => {
              throw new Error("bad json");
            },
          }) as unknown as Response,
      ),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: false, reason: "network" });
  });
});

// ── Payload enrichment (affiliation / References / fundingReferences) ─────────

type Attrs = Record<string, unknown> & {
  creators: Array<Record<string, unknown>>;
  relatedIdentifiers?: Array<Record<string, unknown>>;
  fundingReferences?: Array<Record<string, unknown>>;
};
const attrsOf = (p: Record<string, unknown>) =>
  (p as { data: { attributes: Attrs } }).data.attributes;

function mkItem(id: string, displayText: string, meta: Record<string, unknown> = {}): CvItem {
  return {
    id,
    source: "manual",
    sourceId: "manual",
    displayText,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta,
  } as unknown as CvItem;
}

/** A CV with a ROR-tagged current position, five grants and the fixture works. */
function richCv(): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "m",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: worksFixture as unknown as OpenAlexWork[],
    employments: [
      {
        putCode: "e1",
        organization: "Nagoya University",
        roleTitle: "Researcher",
        startYear: 2024,
        rorId: "04chrp450",
      },
    ],
    now: "2026-06-02T00:00:00.000Z",
  });
  const grants: CvSection = {
    id: "grants",
    type: "grants",
    title: "Grants",
    visible: true,
    order: 91,
    items: [
      mkItem("g1", "Grant A", {
        funderName: "NIH",
        awardId: "R01-123",
        funderId: "https://doi.org/10.13039/100000002",
      }),
      // Funder name only — no identifier to reference → skipped.
      mkItem("g2", "Grant B", { funderName: "DFG" }),
      // Award id but no funder name (DataCite requires funderName) → skipped.
      mkItem("g3", "Grant C", { awardId: "X-1" }),
      // ROR-identified funder, no award number.
      mkItem("g4", "Grant D", { funderName: "ERC", funderId: "https://ror.org/00k4n6c32" }),
      // Unsafe funder id → award-only reference, the id is dropped.
      mkItem("g5", "Grant E", { funderName: "Wellcome", funderId: "javascript:x", awardId: "W-9" }),
      // A safe funder IRI that is neither Crossref Funder ID nor ROR → "Other".
      mkItem("g6", "Grant F", { funderName: "Local Trust", funderId: "https://funder.example/7" }),
    ],
  } as unknown as CvSection;
  return { ...cv, sections: [...cv.sections.filter((s) => s.type !== "grants"), grants] };
}

describe("buildDataciteDoiPayload — public-data enrichment from the frozen CV", () => {
  it("adds the ROR-identified current affiliation to the creator", () => {
    const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, cv: richCv() }, "10.12345"));
    const affiliation = attrs.creators[0]!.affiliation as Array<Record<string, unknown>>;
    expect(affiliation).toHaveLength(1);
    expect(affiliation[0]!.name).toContain("Nagoya University");
    expect(affiliation[0]).toMatchObject({
      affiliationIdentifier: "https://ror.org/04chrp450",
      affiliationIdentifierScheme: "ROR",
      schemeUri: "https://ror.org",
    });
  });

  it("references the shown works' DOIs (bare, de-duplicated) after IsNewVersionOf", () => {
    const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, cv: richCv() }, "10.12345"));
    const rel = attrs.relatedIdentifiers!;
    expect(rel[0]).toEqual({
      relatedIdentifier: "10.12345/prev",
      relatedIdentifierType: "DOI",
      relationType: "IsNewVersionOf",
    });
    const refs = rel.filter((r) => r.relationType === "References");
    const dois = refs.map((r) => r.relatedIdentifier as string);
    expect(refs.every((r) => r.relatedIdentifierType === "DOI")).toBe(true);
    expect(dois).toContain("10.1000/example1");
    expect(dois).toContain("10.1000/example3");
    expect(new Set(dois).size).toBe(dois.length);
    expect(dois.every((d) => d.startsWith("10."))).toBe(true);
    expect(rel).toHaveLength(refs.length + 1);
  });

  it("caps References at MAX_RELATED_WORK_DOIS and skips hidden works and non-DOI works", () => {
    const base = richCv();
    const items = Array.from({ length: MAX_RELATED_WORK_DOIS + 20 }, (_, i) =>
      mkItem(`w${i}`, `Work ${i}`, { doi: `10.1000/cap${i}` }),
    );
    const hidden = { ...mkItem("hid", "Hidden", { doi: "10.1000/hidden" }), included: false };
    const noDoi = mkItem("nodoi", "No DOI");
    const pubs: CvSection = {
      id: "publications",
      type: "publications",
      title: "Publications",
      visible: true,
      order: 1,
      items: [hidden, noDoi, ...items],
    } as unknown as CvSection;
    const cv: CanonicalCv = {
      ...base,
      sections: [...base.sections.filter((s) => s.type !== "publications"), pubs],
    };
    const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, previousDoi: null, cv }, "10.1"));
    const refs = attrs.relatedIdentifiers!;
    expect(refs).toHaveLength(MAX_RELATED_WORK_DOIS);
    expect(refs.map((r) => r.relatedIdentifier)).not.toContain("10.1000/hidden");
  });

  it("References follow the SAME selection the frozen page renders: hideRetracted, publicationsLimit, per-view exclusions", () => {
    const base = richCv();
    const cited = (id: string, doi: string, meta: Record<string, unknown> = {}) => ({
      ...mkItem(id, `Work ${id}`, { doi, ...meta }),
      csl: { id, type: "article-journal", title: `Work ${id}`, DOI: doi },
    });
    const pubs = {
      id: "publications",
      type: "publications",
      title: "Publications",
      visible: true,
      order: 1,
      items: [
        cited("a", "10.1000/a"),
        cited("r", "10.1000/retracted", { retracted: true }),
        cited("b", "10.1000/b"),
        cited("c", "10.1000/c"),
      ],
    } as unknown as CvSection;
    const withPubs = (display: Partial<CanonicalCv["display"]>): CanonicalCv => ({
      ...base,
      sections: [...base.sections.filter((s) => s.type !== "publications"), pubs],
      display: { ...base.display, publicationOrder: "custom", ...display },
    });

    // "Hide retracted" on → the retracted work is not on the page → not cited.
    expect(visibleWorkDois(withPubs({ hideRetracted: true }), 50)).toEqual([
      "10.1000/a",
      "10.1000/b",
      "10.1000/c",
    ]);
    // Off (the page lists it with a "Retracted" badge) → STILL never cited: a
    // DOI record must not assert a retracted work as a reference of the CV.
    expect(visibleWorkDois(withPubs({ hideRetracted: false }), 50)).not.toContain(
      "10.1000/retracted",
    );
    // "Selected publications" cap → only the works the page shows.
    expect(visibleWorkDois(withPubs({ publicationsLimit: 1 }), 50)).toEqual(["10.1000/a"]);
    // Per-view exclusion ("hide from this view") → dropped too.
    expect(visibleWorkDois(withPubs({ excludedItems: { publications: ["b"] } }), 50)).toEqual([
      "10.1000/a",
      "10.1000/c",
    ]);
    // And the payload is built from that very selection.
    const attrs = attrsOf(
      buildDataciteDoiPayload(
        { ...INPUT, previousDoi: null, cv: withPubs({ publicationsLimit: 1 }) },
        "10.1",
      ),
    );
    expect(attrs.relatedIdentifiers).toEqual([
      { relatedIdentifier: "10.1000/a", relatedIdentifierType: "DOI", relationType: "References" },
    ]);
  });

  it("builds fundingReferences only from grants with a funder name AND an id to cite", () => {
    const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, cv: richCv() }, "10.12345"));
    expect(attrs.fundingReferences).toEqual([
      {
        funderName: "NIH",
        funderIdentifier: "https://doi.org/10.13039/100000002",
        funderIdentifierType: "Crossref Funder ID",
        awardNumber: "R01-123",
        awardTitle: "Grant A",
      },
      {
        funderName: "ERC",
        funderIdentifier: "https://ror.org/00k4n6c32",
        funderIdentifierType: "ROR",
        awardTitle: "Grant D",
      },
      { funderName: "Wellcome", awardNumber: "W-9", awardTitle: "Grant E" },
      {
        funderName: "Local Trust",
        funderIdentifier: "https://funder.example/7",
        funderIdentifierType: "Other",
        awardTitle: "Grant F",
      },
    ]);
  });

  it("omits every enrichment field when the CV carries nothing to cite (or no CV at all)", () => {
    const bare = buildCanonicalCv({
      id: "b",
      resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "B" },
      works: [],
      now: "2026-06-02T00:00:00.000Z",
    });
    for (const cv of [bare, undefined]) {
      const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, previousDoi: null, cv }, "10.1"));
      expect(attrs.creators[0]!.affiliation).toBeUndefined();
      expect(attrs.relatedIdentifiers).toBeUndefined();
      expect(attrs.fundingReferences).toBeUndefined();
    }
  });

  it("names the affiliation without an identifier when the position has no valid ROR id", () => {
    const cv = buildCanonicalCv({
      id: "n",
      resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "B" },
      works: [],
      employments: [{ putCode: "e", organization: "Some Lab", startYear: 2020 }],
      now: "2026-06-02T00:00:00.000Z",
    });
    const attrs = attrsOf(buildDataciteDoiPayload({ ...INPUT, cv }, "10.12345"));
    const affiliation = attrs.creators[0]!.affiliation as Array<Record<string, unknown>>;
    expect(affiliation[0]!.name).toContain("Some Lab");
    expect(affiliation[0]!.affiliationIdentifier).toBeUndefined();
    expect(affiliation[0]!.affiliationIdentifierScheme).toBeUndefined();
  });
});

// ── Tombstone (account deletion) ──────────────────────────────────────────────

describe("tombstoneSnapshotDoi", () => {
  it("exposes the stable tombstone path (never under /p/)", () => {
    expect(WITHDRAWN_PATH).toBe("withdrawn");
  });

  it("is a no-op (no network call) when minting is disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await tombstoneSnapshotDoi({ doi: "10.12345/abcd" }, BASE)).toEqual({
      ok: false,
      reason: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a malformed DOI before any request (no path injection)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const bad of ["not-a-doi", "10.1/", "../dois", "10.12345/a b", ""]) {
      expect(await tombstoneSnapshotDoi({ doi: bad }, ENABLED)).toEqual({
        ok: false,
        reason: "bad-doi",
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PUTs event:hide + the tombstone URL + a MINIMISED record to the DOI with basic auth", async () => {
    const fetchMock = vi.fn(async () => res({ data: { id: "10.12345/abcd" } }, true, 200));
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await tombstoneSnapshotDoi({ doi: "10.12345/AbCd", ownerName: " Basile Chrétien " }, ENABLED),
    ).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${DATACITE_DOIS_URL}/10.12345/abcd`);
    expect(init.method).toBe("PUT");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("SIGMA.CV:hunter2").toString("base64")}`,
    );
    expect(headers["Content-Type"]).toBe("application/vnd.api+json");
    const body = JSON.parse(init.body as string) as {
      data: { type: string; attributes: Record<string, unknown> };
    };
    expect(body.data.type).toBe("dois");
    const attrs = body.data.attributes;
    expect(attrs.event).toBe("hide");
    expect(attrs.url).toMatch(/^https:\/\/[^/]+\/withdrawn$/);
    // Data minimisation: the hidden record keeps only what DataCite's mandatory
    // fields need — the creator's bare name (no ORCID, no affiliation), a neutral
    // title — and explicitly CLEARS the referenced works and the funding.
    // publisher / publicationYear / types are untouched, so the record stays
    // schema-valid.
    expect(attrs.creators).toEqual([{ name: "Basile Chrétien" }]);
    expect(attrs.titles).toEqual([{ title: "Withdrawn CV version" }]);
    expect(attrs.relatedIdentifiers).toEqual([]);
    expect(attrs.fundingReferences).toEqual([]);
    expect(Object.keys(attrs).sort()).toEqual([
      "creators",
      "event",
      "fundingReferences",
      "relatedIdentifiers",
      "titles",
      "url",
    ]);
    expect(JSON.stringify(body)).not.toContain("orcid");
  });

  it("falls back to a placeholder creator when the owner's name is no longer known (cron retry)", async () => {
    // The retry queue holds no personal data, so a drained withdrawal has no
    // name to send — the record is minimised further, never left untouched.
    const fetchMock = vi.fn(async () => res({}, true, 200));
    vi.stubGlobal("fetch", fetchMock);
    expect(await tombstoneSnapshotDoi({ doi: "10.12345/abcd" }, ENABLED)).toEqual({ ok: true });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    const attrs = (JSON.parse(init.body as string) as { data: { attributes: Attrs } }).data
      .attributes;
    expect(attrs.creators).toEqual([{ name: "Researcher" }]);
  });

  it("encodes an unusual DOI suffix into the path", async () => {
    const fetchMock = vi.fn(async () => res({}, true, 200));
    vi.stubGlobal("fetch", fetchMock);
    expect(await tombstoneSnapshotDoi({ doi: "10.12345/ab#c?d" }, ENABLED)).toEqual({
      ok: true,
    });
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(
      `${DATACITE_DOIS_URL}/10.12345/ab%23c%3Fd`,
    );
  });

  it("fails soft on a non-2xx status and on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ errors: [{ title: "nope" }] }, false, 404)),
    );
    expect(await tombstoneSnapshotDoi({ doi: "10.12345/abcd" }, ENABLED)).toEqual({
      ok: false,
      reason: "http-404",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );
    expect(await tombstoneSnapshotDoi({ doi: "10.12345/abcd" }, ENABLED)).toEqual({
      ok: false,
      reason: "network",
    });
  });
});
