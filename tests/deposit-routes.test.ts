import { describe, expect, it } from "vitest";
import {
  basisChangesPrimary,
  depositAction,
  depositActionKind,
  depositNotes,
  depositReason,
  depositRoutes,
  regionName,
  shareYourPaperHref,
  type DepositContext,
  type DepositRoute,
} from "@/lib/archiving/depositRoutes";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import type { FunderRow } from "@/lib/funders/join";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The deposit routes for one closed journal article: the order IS the rule
 * (funder, open own, national, other own, Zenodo), each route says which rule put
 * it there, a destination is never repeated, the action's words never go beyond
 * the publisher's record, and nothing is counted or scored.
 */

const EN = workspaceUi("en-US");
const TODAY = "2026-09-15";
const NIH: FunderRow = {
  openalexId: "F100",
  fundrefDoi: "10.13039/100000002",
  name: "National Institutes of Health",
};
const WELLCOME: FunderRow = {
  openalexId: "F200",
  fundrefDoi: "10.13039/100010269",
  name: "Wellcome Trust",
};
const KYOTO = {
  sourceId: "S4306401454",
  name: "Kyoto University Research Information Repository",
  url: "https://repository.kulib.kyoto-u.ac.jp",
};
const HAL_OWN = { sourceId: "S4306402512", name: "HAL", url: "https://hal.science/submit" };
const ZENODO_OWN = {
  sourceId: "S4306400562",
  name: "Zenodo",
  url: "https://zenodo.org/uploads/new",
};
const ARXIV_OWN = { sourceId: "S4306400194", name: "arXiv", url: "https://arxiv.org/submit" };

type SelfArchiving = NonNullable<CvItem["meta"]["selfArchiving"]>;
const record = (over: Partial<SelfArchiving> = {}): SelfArchiving => ({
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: [],
  retrievedAt: "2026-09-15T00:00:00.000Z",
  ...over,
});

function work(meta: CvItem["meta"] = {}, csl: Record<string, unknown> = {}): CvItem {
  return {
    id: "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id: "W1", type: "article-journal", title: "One", DOI: "10.1234/w1", ...csl },
    meta: { year: 2023, oaIsOpen: false, ...meta },
  };
}

function cvWith(owner: Partial<CanonicalCv["owner"]> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "dr",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Owner",
      ...owner,
    },
    display: {},
    sections: [],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

const ctx = (over: Partial<DepositContext> = {}): DepositContext => ({
  basis: "paper",
  crosswalk: new Map([
    ["F100", NIH],
    ["F200", WELLCOME],
  ]),
  ...over,
});

const kinds = (routes: DepositRoute[]) => routes.map((r) => r.kind);
const NIH_WORK = { funders: [{ id: "https://openalex.org/F100", name: "NIH" }] };

describe("depositRoutes — the rule stack", () => {
  it("follows the rule order — funder, open own, national, other own, then Zenodo — each with its own reason", () => {
    const routes = depositRoutes(
      cvWith({ depositRepositories: [KYOTO, ARXIV_OWN] }),
      work({ ...NIH_WORK, workCountries: ["FR"] }),
      ctx(),
    );
    expect(kinds(routes)).toEqual(["funder", "own", "national", "own", "zenodo"]);
    expect(routes.map((r) => r.href)).toEqual([
      "https://www.nihms.nih.gov/",
      ARXIV_OWN.url,
      "https://hal.science/submit",
      KYOTO.url,
      "https://zenodo.org/uploads/new",
    ]);
    expect(routes.map((r) => r.reason)).toEqual([
      { key: "wlDepositBecauseFunder", params: { funder: "National Institutes of Health" } },
      { key: "wlDepositBecauseOwn", params: { repository: "arXiv" } },
      { key: "wlDepositBecausePaperCountry", params: { country: "FR" } },
      { key: "wlDepositBecauseOwn", params: { repository: KYOTO.name } },
      { key: "wlDepositZenodoAny", params: {} },
    ]);
  });

  it("routes to a funder's confirmed repository, and never for a funder with none on record", () => {
    const routes = depositRoutes(
      cvWith(),
      work({
        funders: [
          { id: "https://openalex.org/F200", name: "Wellcome" },
          { id: "https://openalex.org/F999", name: "Unknown funder" },
        ],
      }),
      ctx(),
    );
    expect(kinds(routes)).toEqual(["funder", "zenodo"]);
    expect(routes[0]).toMatchObject({
      destination: "Europe PMC plus",
      href: "https://plus.europepmc.org/",
      reason: { key: "wlDepositBecauseFunder", params: { funder: "Wellcome Trust" } },
    });
    const unknown = work({ funders: [{ id: "https://openalex.org/F999", name: "Unknown" }] });
    expect(kinds(depositRoutes(cvWith(), unknown, ctx()))).toEqual(["zenodo"]);
  });

  it("names the funder from the crosswalk, then from the work, then from the table", () => {
    const blankRow = new Map([["F100", { ...NIH, name: " " }]]);
    const fromWork = depositRoutes(
      cvWith(),
      work({ funders: [{ id: "https://openalex.org/F100", name: "NIH (on the work)" }] }),
      ctx({ crosswalk: blankRow }),
    );
    expect(fromWork[0]!.reason.params).toEqual({ funder: "NIH (on the work)" });
    const fromTable = depositRoutes(
      cvWith(),
      work({ funders: [{ id: "https://openalex.org/F100" }] }),
      ctx({ crosswalk: blankRow }),
    );
    expect(fromTable[0]!.reason.params).toEqual({ funder: "National Institutes of Health (NIH)" });
  });

  it("never repeats a destination an earlier rule already reached", () => {
    const routes = depositRoutes(
      cvWith({ depositRepositories: [HAL_OWN, ZENODO_OWN] }),
      work({ workCountries: ["FR"] }),
      ctx(),
    );
    expect(kinds(routes)).toEqual(["own", "own"]);
    expect(routes[0]!.reason.key).toBe("wlDepositBecauseOwn");
  });

  it("prefers the paper's country that has a national repository", () => {
    const routes = depositRoutes(cvWith(), work({ workCountries: ["JP", "FR"] }), ctx());
    expect(kinds(routes)).toEqual(["national", "zenodo"]);
    expect(routes[0]!.reason.params).toEqual({ country: "FR" });
  });

  it("says why Zenodo stands alone: no country on the paper, or no national repository on record", () => {
    expect(depositRoutes(cvWith(), work(), ctx())[0]!.reason).toEqual({
      key: "wlDepositBecauseNoAffiliation",
      params: {},
    });
    expect(depositRoutes(cvWith(), work({ workCountries: ["JP"] }), ctx())[0]!.reason).toEqual({
      key: "wlDepositBecauseNoRepositoryPaper",
      params: { country: "JP" },
    });
  });

  it("follows the owner's current affiliation when they choose it", () => {
    const paperFr = work({ workCountries: ["FR"] });
    const currentJp = depositRoutes(
      cvWith(),
      paperFr,
      ctx({ basis: "current", currentCountry: "JP" }),
    );
    expect(kinds(currentJp)).toEqual(["zenodo"]);
    expect(currentJp[0]!.reason).toEqual({
      key: "wlDepositBecauseNoRepositoryCurrent",
      params: { country: "JP" },
    });
    const currentFr = depositRoutes(
      cvWith(),
      work({ workCountries: ["DE"] }),
      ctx({ basis: "current", currentCountry: "FR" }),
    );
    expect(currentFr[0]!.reason).toEqual({
      key: "wlDepositBecauseCurrentCountry",
      params: { country: "FR" },
    });
    // No current country known: nothing to route by but Zenodo.
    expect(depositRoutes(cvWith(), paperFr, ctx({ basis: "current" }))[0]!.reason.key).toBe(
      "wlDepositBecauseNoAffiliation",
    );
  });
});

describe("basisChangesPrimary", () => {
  it("is true only when the current affiliation would change the one action", () => {
    const { crosswalk } = ctx();
    const changes = (countries: string[] | undefined, currentCountry: string | undefined) =>
      basisChangesPrimary(cvWith(), work({ workCountries: countries }), {
        currentCountry,
        crosswalk,
      });
    expect(changes(["FR"], undefined)).toBe(false);
    expect(changes(["FR"], "FR")).toBe(false);
    expect(changes(["FR"], "JP")).toBe(true);
    expect(changes(undefined, "FR")).toBe(true);
    // Both affiliations lead to Zenodo: the choice would change nothing.
    expect(changes(["JP"], "US")).toBe(false);
  });
});

describe("depositAction — never beyond the publisher's record", () => {
  const [hal] = depositRoutes(cvWith(), work({ workCountries: ["FR"] }), ctx());
  const [zenodo] = depositRoutes(cvWith(), work(), ctx());
  const [kyoto] = depositRoutes(cvWith({ depositRepositories: [KYOTO] }), work(), ctx());
  const [nih] = depositRoutes(cvWith(), work(NIH_WORK), ctx());
  const action = (meta: CvItem["meta"], route: DepositRoute | undefined, statutory = false) =>
    depositAction(work(meta), route!, EN, statutory);

  it("names the kind of action — what the worklist orders closed works by", () => {
    expect(depositActionKind(work(), hal!)).toBe("unrecorded");
    expect(depositActionKind(work({ selfArchiving: record({ versions: [] }) }), hal!)).toBe(
      "unrecorded",
    );
    expect(depositActionKind(work({ selfArchiving: record() }), hal!)).toBe("version");
    expect(
      depositActionKind(work({ selfArchiving: record({ canArchive: false, versions: [] }) }), hal!),
    ).toBe("conditional");
    expect(
      depositActionKind(
        work({ selfArchiving: record({ locations: ["Institutional Repository"] }) }),
        zenodo!,
      ),
    ).toBe("conditional");
    // A funder's repository takes the accepted manuscript whatever the record says.
    expect(
      depositActionKind(work({ ...NIH_WORK, selfArchiving: record({ canArchive: false }) }), nih!),
    ).toBe("version");
  });

  it("asks for the accepted manuscript, not the publisher's PDF, when no policy is recorded", () => {
    expect(action({}, hal)).toBe(
      "Deposit your accepted manuscript, not the publisher's PDF, in HAL if the journal's policy allows it",
    );
  });

  it("names the version the record allows, the publisher's own first", () => {
    expect(action({ selfArchiving: record() }, hal)).toBe("Deposit the accepted manuscript in HAL");
    expect(
      action(
        { selfArchiving: record({ versions: ["submittedVersion", "publishedVersion"] }) },
        hal,
      ),
    ).toBe("Deposit the published version in HAL");
    expect(action({ selfArchiving: record({ versions: ["submittedVersion"] }) }, hal)).toBe(
      "Deposit the submitted manuscript in HAL",
    );
    expect(action({ selfArchiving: record({ versions: [] }) }, hal)).toMatch(
      /^Deposit your accepted manuscript, not the publisher's PDF, in HAL/,
    );
  });

  it("says “only if” when the record allows no deposit — naming a right only when one is shown", () => {
    const refused = { selfArchiving: record({ canArchive: false, versions: [] }) };
    expect(action(refused, hal)).toBe("Deposit in HAL only if your publishing agreement allows it");
    expect(action(refused, hal, true)).toBe(
      "Deposit in HAL only if a right shown above or your publishing agreement allows it",
    );
  });

  it("says “only if” when the record names only places the destination is not", () => {
    const institutional = { selfArchiving: record({ locations: ["Institutional Repository"] }) };
    expect(action(institutional, hal)).toBe("Deposit the accepted manuscript in HAL");
    expect(action(institutional, zenodo)).toBe(
      "Deposit in Zenodo only if your publishing agreement allows it",
    );
    expect(action(institutional, kyoto)).toBe(
      `Deposit in ${KYOTO.name} only if your publishing agreement allows it`,
    );
    const anywhere = { selfArchiving: record({ locations: ["Any Repository"] }) };
    expect(action(anywhere, kyoto)).toBe(`Deposit the accepted manuscript in ${KYOTO.name}`);
  });

  it("offers a funder's repository for the accepted manuscript, whatever the publisher records", () => {
    expect(action({ selfArchiving: record({ canArchive: false, versions: [] }) }, nih)).toBe(
      "Deposit the accepted manuscript in PubMed Central (NIHMS)",
    );
  });
});

describe("depositNotes — what the record asks of the form", () => {
  const [hal] = depositRoutes(cvWith(), work({ workCountries: ["FR"] }), ctx());
  const [zenodo] = depositRoutes(cvWith(), work(), ctx());
  const [nih] = depositRoutes(cvWith(), work(NIH_WORK), ctx());
  const notes = (meta: CvItem["meta"], route: DepositRoute | undefined, csl = {}) =>
    depositNotes(work(meta, csl), route!, EN, "en-US", TODAY);
  const NO_DOI = { DOI: undefined };

  it("carries the licence and an embargo that is still running", () => {
    const running = record({ licence: "cc-by-nc-nd", embargoMonths: 12, embargoEnd: "2027-01-23" });
    expect(notes({ selfArchiving: running }, hal, NO_DOI)).toEqual([
      "In the form, set the licence to cc-by-nc-nd.",
      "Keep the file under embargo until 2027-01-23.",
    ]);
    expect(notes({ selfArchiving: { ...running, embargoEnd: "2021-01-23" } }, hal, NO_DOI)).toEqual(
      ["In the form, set the licence to cc-by-nc-nd."],
    );
    expect(notes({ selfArchiving: record({ embargoMonths: 6 }) }, hal, NO_DOI)).toEqual([
      "Keep the file under embargo for 6 months after publication.",
    ]);
    expect(notes({ selfArchiving: record({ embargoMonths: 0 }) }, hal, NO_DOI)).toEqual([]);
  });

  it("says nothing of the policy's conditions for a funder's repository or a record that allows no deposit", () => {
    expect(notes({ ...NIH_WORK, selfArchiving: record({ licence: "cc-by" }) }, nih)).toEqual([]);
    expect(
      notes(
        { selfArchiving: record({ canArchive: false, versions: [], licence: "cc-by" }) },
        hal,
        NO_DOI,
      ),
    ).toEqual([]);
  });

  it("tells a Zenodo depositor where the publisher's DOI goes — when the work has one", () => {
    expect(notes({}, zenodo)).toEqual([EN.wlDepositZenodoDoi]);
    expect(notes({}, zenodo, NO_DOI)).toEqual([]);
  });

  it("tells a HAL depositor to paste the DOI where the form loads metadata — after the record's conditions, whatever the record says", () => {
    expect(notes({}, hal)).toEqual([EN.wlDepositHalDoi]);
    expect(notes({}, hal, NO_DOI)).toEqual([]);
    expect(notes({}, hal, { DOI: "  " })).toEqual([]);
    expect(notes({ selfArchiving: record({ licence: "cc-by" }) }, hal)).toEqual([
      "In the form, set the licence to cc-by.",
      EN.wlDepositHalDoi,
    ]);
    expect(notes({ selfArchiving: record({ canArchive: false, versions: [] }) }, hal)).toEqual([
      EN.wlDepositHalDoi,
    ]);
    // HAL reached because the owner's works sit there, not by country: the same note.
    const [ownHal] = depositRoutes(cvWith({ depositRepositories: [HAL_OWN] }), work(), ctx());
    expect(ownHal!.kind).toBe("own");
    expect(notes({}, ownHal)).toEqual([EN.wlDepositHalDoi]);
    // Neither a funder's repository nor Zenodo gets the HAL note.
    expect(notes({}, nih)).toEqual([]);
    expect(notes({}, zenodo)).not.toContain(EN.wlDepositHalDoi);
  });

  it("quotes HAL's own labels only in French, the one interface language they were read in", () => {
    const fr = workspaceUi("fr-FR").wlDepositHalDoi;
    expect(fr).toContain("Chargez les métadonnées à partir d'un identifiant");
    expect(fr).toContain("Récupérer les métadonnées");
    expect(EN.wlDepositHalDoi).not.toMatch(/Chargez|Récupérer/);
  });
});

describe("the route sentences", () => {
  it("words each reason in the viewer's locale, with the country named there", () => {
    const [national] = depositRoutes(cvWith(), work({ workCountries: ["FR"] }), ctx());
    expect(depositReason(national!, EN, "en-US")).toBe(
      "because of your affiliation on this paper (France)",
    );
    expect(depositReason(national!, workspaceUi("ja-JP"), "ja-JP")).toContain("フランス");
    const [own] = depositRoutes(cvWith({ depositRepositories: [HAL_OWN] }), work(), ctx());
    expect(depositReason(own!, EN, "en-US")).toBe(
      "because OpenAlex lists some of your works in HAL",
    );
    expect(regionName("DE", "fr-FR")).toBe("Allemagne");
  });
});

describe("shareYourPaperHref", () => {
  it("links ShareYourPaper for a DOI in any of its written forms, the slash kept and the rest escaped", () => {
    expect(shareYourPaperHref("10.1002/pds.5000")).toBe(
      "https://shareyourpaper.org/10.1002/pds.5000",
    );
    expect(shareYourPaperHref(" https://doi.org/10.1002/pds.5000 ")).toBe(
      "https://shareyourpaper.org/10.1002/pds.5000",
    );
    expect(shareYourPaperHref("doi:10.1002/(SICI)1:3<223>;2-X")).toBe(
      "https://shareyourpaper.org/10.1002/(SICI)1%3A3%3C223%3E%3B2-X",
    );
  });

  it("refuses a malformed, over-long or dot-segment DOI, and one carrying ?, #, % or a backslash", () => {
    for (const doi of [
      undefined,
      "",
      "not a doi",
      "10.1234/../x",
      `10.1234/${"a".repeat(300)}`,
      "10.1234/a?b",
      "10.1234/a#b",
      "10.1234/%2e%2e",
      "10.1234/a\\b",
    ]) {
      expect(shareYourPaperHref(doi), String(doi)).toBeUndefined();
    }
  });
});
