import { describe, expect, it } from "vitest";
import { publisherPolicyLines, statutoryLine } from "@/lib/archiving/rightsSentences";
import { STATUTORY_ARCHIVING, type StatutoryArchivingEntry } from "@/lib/archiving/statutoryRights";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { openAccessStates } from "@/lib/cv/worklist";
import { fill } from "@/lib/i18n/fill";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The worklist's rights lines as plain strings — built only from the stored
 * OA.Works record and the committed statutory table. Facts with their dates and
 * sources; nothing counted, nothing judged.
 */

type Record = NonNullable<CvItem["meta"]["selfArchiving"]>;

const EN = workspaceUi("en-US");
const CELL: Record = {
  source: "oa.works",
  canArchive: true,
  versions: ["submittedVersion", "acceptedVersion"],
  embargoMonths: 12,
  embargoEnd: "2021-01-23",
  locations: ["Institutional Repository", "Non-commercial Subject Repository"],
  licence: "cc-by-nc-nd",
  depositStatement: "© This manuscript version is made available under the CC-BY-NC-ND 4.0 license",
  recordUpdated: "2021-01-27",
  policyUrl: "https://perma.cc/J5MA-H2EJ",
  retrievedAt: "2026-09-15T08:30:00.000Z",
};
const entry = (code: string) => STATUTORY_ARCHIVING.find((e) => e.countryCode === code)!;

describe("publisherPolicyLines", () => {
  it("states what the record allows, where, the embargo with its end, the licence, both dates, the statement and the archived policy", () => {
    expect(publisherPolicyLines(CELL, EN, "en-US")).toEqual({
      summary:
        "Publisher policy recorded by OA.Works: self-archiving allowed — submitted manuscript or accepted manuscript.",
      details: [
        "Where: Institutional Repository or Non-commercial Subject Repository.",
        "Embargo: 12 months, ending 2021-01-23.",
        "Licence for the deposited copy: cc-by-nc-nd.",
      ],
      dates: "OA.Works record updated 2021-01-27; retrieved 2026-09-15.",
      statement: CELL.depositStatement,
      policyUrl: CELL.policyUrl,
    });
  });

  it("records a refusal as the record's words only — no details, no statement — with its dates", () => {
    expect(publisherPolicyLines({ ...CELL, canArchive: false }, EN, "en-US")).toEqual({
      summary: EN.wlArchivingNotAllowed,
      details: [],
      dates: "OA.Works record updated 2021-01-27; retrieved 2026-09-15.",
      policyUrl: CELL.policyUrl,
    });
  });

  it("prints only what the record states", () => {
    const sparse: Record = {
      source: "oa.works",
      canArchive: true,
      versions: [],
      locations: [],
      retrievedAt: "2026-09-15T00:00:00.000Z",
    };
    expect(publisherPolicyLines(sparse, EN, "en-US")).toEqual({
      summary:
        "Publisher policy recorded by OA.Works: self-archiving allowed — version not stated.",
      details: [],
      dates: "Retrieved from OA.Works 2026-09-15; the record gives no update date.",
      statement: undefined,
      policyUrl: undefined,
    });
    expect(publisherPolicyLines({ ...sparse, embargoMonths: 0 }, EN, "en-US").details).toEqual([
      "No embargo.",
    ]);
    expect(publisherPolicyLines({ ...sparse, embargoMonths: 6 }, EN, "en-US").details).toEqual([
      "Embargo: 6 months after publication.",
    ]);
    expect(publisherPolicyLines({ ...sparse, embargoMonths: 1 }, EN, "en-US").details).toEqual([
      "Embargo: 1 month after publication.",
    ]);
  });

  it("never lets a recorded value splice replacement patterns into the copy", () => {
    const lines = publisherPolicyLines({ ...CELL, licence: "$& $' $`" }, EN, "en-US");
    expect(lines.details).toContain("Licence for the deposited copy: $& $' $`.");
  });

  it("formats the duration, the or-lists and the version names in the viewer's locale", () => {
    const fr = publisherPolicyLines(CELL, workspaceUi("fr-FR"), "fr-FR");
    expect(fr.summary).toContain("manuscrit soumis ou manuscrit accepté");
    // Intl writes "12 mois" with a no-break space; the copy takes it as given.
    const twelveMonths = new Intl.NumberFormat("fr-FR", {
      style: "unit",
      unit: "month",
      unitDisplay: "long",
    }).format(12);
    expect(twelveMonths.replace(/\s/g, " ")).toBe("12 mois");
    expect(fr.details).toContain(`Embargo : ${twelveMonths}, jusqu'au 2021-01-23.`);
    // OA.Works' own words for repository kinds stay as recorded.
    expect(fr.details[0]).toContain(
      "Institutional Repository ou Non-commercial Subject Repository",
    );
  });
});

describe("statutoryLine", () => {
  it("words a verified author right as something that may also apply, dated, linked to its legal text and guidance", () => {
    const fr = entry("FR");
    const line = statutoryLine(fr, EN, "en-US");
    expect(line.text).toBe(
      `May also apply — secondary-publication right (France), ${fr.instrument}: ${fr.statements.join("; ")}.`,
    );
    expect(line.verification).toBe("Recorded on 2026-09-15.");
    expect(line.sourceUrl).toBe(fr.sourceUrl);
    expect(line.sourceLabel).toBe(EN.wlStatutorySourceLink);
    expect(line.guidanceUrl).toBe(fr.guidanceUrl);
  });

  it("labels Japan's policy document as policy text, with its implementation measures as guidance — never as legal text", () => {
    const line = statutoryLine(entry("JP"), EN, "en-US");
    expect(line.sourceLabel).toBe(EN.wlStatutoryPolicyLink);
    expect(line.sourceLabel).not.toBe(EN.wlStatutorySourceLink);
    expect(line.guidanceUrl).toBe(entry("JP").guidanceUrl);
  });

  it("labels a guidance page as guidance, never as legal text", () => {
    const guided: StatutoryArchivingEntry = {
      ...entry("JP"),
      sourceUrl: "https://example.org/explained",
      sourceKind: "guidance",
      guidanceUrl: undefined,
    };
    const line = statutoryLine(guided, EN, "en-US");
    expect(line.sourceLabel).toBe(EN.wlStatutoryGuidanceLink);
    expect(line.guidanceUrl).toBeUndefined();
  });

  it("links Belgium and Bulgaria to their legal text — Belgium with its guidance page too", () => {
    const be = statutoryLine(entry("BE"), EN, "en-US");
    expect(be.sourceLabel).toBe(EN.wlStatutorySourceLink);
    expect(be.guidanceUrl).toBe(entry("BE").guidanceUrl);
    const bg = statutoryLine(entry("BG"), EN, "en-US");
    expect(bg.text).toContain("secondary-publication right (Bulgaria)");
    expect(bg.sourceLabel).toBe(EN.wlStatutorySourceLink);
    expect(bg.guidanceUrl).toBeUndefined();
  });

  it("gives a pending entry the pending wording and never a date", () => {
    const pending: StatutoryArchivingEntry = {
      countryCode: "XX",
      kind: "author-right",
      instrument: "A drafted instrument",
      sourceUrl: "https://example.org/law",
      sourceKind: "legal-text",
      statements: ["a drafted statement"],
      verifiedBy: "maintainer-pending",
    };
    const line = statutoryLine(pending, EN, "en-US");
    expect(line.verification).toBe(EN.wlStatutoryPending);
    expect(line.verification).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("words each kind its own way, with the country named in the viewer's locale", () => {
    expect(statutoryLine(entry("ES"), EN, "en-US").text).toMatch(
      /^May also apply — statutory repository-deposit requirement \(Spain\), /,
    );
    expect(statutoryLine(entry("JP"), EN, "en-US").text).toMatch(
      /^May also apply — national open-access policy \(Japan\), /,
    );
    expect(statutoryLine(entry("DE"), workspaceUi("ja-JP"), "ja-JP").text).toContain("（ドイツ）");
  });
});

describe("openAccessStates — the rights inputs on each row", () => {
  function cvWith(meta: CvItem["meta"], type = "article-journal"): CanonicalCv {
    return CanonicalCvSchema.parse({
      schemaVersion: 2,
      id: "wr",
      owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
      display: {},
      sections: [
        {
          id: "pubs",
          type: "publications",
          title: "Publications",
          visible: true,
          order: 0,
          items: [
            {
              id: "W1",
              source: "openalex",
              sourceId: "https://openalex.org/W1",
              included: true,
              notMine: false,
              order: 0,
              authoredBySelf: true,
              selfNameVariants: [],
              csl: { id: "W1", type, title: "One" },
              meta: {
                year: 2020,
                oaIsOpen: false,
                repositoryCopiesCheckedAt: "2026-09-01T00:00:00.000Z",
                ...meta,
              },
            },
          ],
        },
      ],
      provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
    });
  }

  it("carries the stored OA.Works record and the statutory entries that can cover the work", () => {
    const [row] = openAccessStates(
      cvWith({ selfArchiving: CELL, workCountries: ["US", "FR", "JP"] }),
    ).rows;
    expect(row!.selfArchiving).toEqual(CELL);
    // A 2020 paper: France's right can cover it, Japan's FY2025 policy cannot.
    expect(row!.statutory.map((e) => e.countryCode)).toEqual(["FR"]);
    const [recent] = openAccessStates(cvWith({ year: 2025, workCountries: ["FR", "JP"] })).rows;
    expect(recent!.statutory.map((e) => e.countryCode)).toEqual(["FR", "JP"]);
  });

  it("uses the owner's year override and the work's type to decide", () => {
    const [overridden] = openAccessStates(
      cvWith({ year: 2020, yearOverride: 2026, workCountries: ["JP"] }),
    ).rows;
    expect(overridden!.statutory.map((e) => e.countryCode)).toEqual(["JP"]);
    const [chapter] = openAccessStates(cvWith({ workCountries: ["FR", "NL"] }, "chapter")).rows;
    expect(chapter!.statutory.map((e) => e.countryCode)).toEqual(["NL"]);
  });

  it("carries nothing when the owner's sync stored nothing", () => {
    const [row] = openAccessStates(cvWith({})).rows;
    expect(row!.selfArchiving).toBeUndefined();
    expect(row!.statutory).toEqual([]);
  });
});

describe("fill", () => {
  it("substitutes every occurrence of every key with a function replacer", () => {
    expect(fill("{a} and {a}, {b}", { a: "$&", b: "x" })).toBe("$& and $&, x");
    expect(fill("no placeholders", { a: "1" })).toBe("no placeholders");
  });

  it("never re-scans a substituted value, and leaves a placeholder without a value as written", () => {
    expect(fill("{a}|{b}", { a: "{b}", b: "x" })).toBe("{b}|x");
    expect(fill("{a} {missing}", { a: "1" })).toBe("1 {missing}");
    expect(fill("{toString}", {})).toBe("{toString}");
  });
});
