import { describe, expect, it, vi } from "vitest";
import {
  FAILING_PROBLEMS,
  checkCvModelSources,
  formatSourceReport,
  pageLinksTo,
  type FetchedPage,
  type PageFetcher,
} from "@/lib/canonical/cvModelSourceCheck";
import { verifiedCvModelSources, type CvModelSource } from "@/lib/canonical/cvModelSources";
import type { CvModelId } from "@/lib/canonical/cvModels";

/**
 * The monthly check: every fetch here is a fake, keyed by address, so each
 * problem the workflow can report is produced on purpose.
 */

const DOC = "https://funder.example/files/2027/guide.pdf";
const PAGE = "https://funder.example/calls/2027";
const BEFORE_DUE = new Date("2026-11-01T00:00:00Z");

const source = (over: Partial<CvModelSource> = {}): CvModelSource => ({
  document: "Guide 2027",
  url: DOC,
  listedOn: PAGE,
  lastVerified: "2026-10-16",
  recheckBy: "2027-07-15",
  ...over,
});
const table = (...docs: CvModelSource[]): ReadonlyArray<readonly [CvModelId, CvModelSource[]]> => [
  ["anr", docs],
];

/** A fetcher answering each address from `answers`; anything else is a 404. */
function fetcher(answers: Record<string, FetchedPage | Error | string>): PageFetcher {
  return vi.fn(async (url: string) => {
    const answer = answers[url];
    if (answer instanceof Error) throw answer;
    if (typeof answer === "string") throw answer; // a non-Error rejection
    return answer ?? { status: 404 };
  });
}

const linkingPage = { status: 200, body: `<a href="/files/2027/guide.pdf">Guide</a>` };

describe("pageLinksTo", () => {
  it("finds a link written absolute, root-relative, or with &amp; in its query", () => {
    expect(pageLinksTo(`<a href="${DOC}">`, DOC)).toBe(true);
    expect(pageLinksTo(`<a href="/files/2027/guide.pdf">`, DOC)).toBe(true);
    const withQuery = "https://funder.example/get?id=7&lang=fr";
    expect(pageLinksTo(`<a href="/get?id=7&amp;lang=fr">`, withQuery)).toBe(true);
  });

  it("does not find a document the page no longer links to", () => {
    expect(pageLinksTo(`<a href="/files/2028/guide.pdf">`, DOC)).toBe(false);
  });
});

describe("checkCvModelSources", () => {
  it("reports nothing when the reading is current, the document answers and is still listed", async () => {
    const fetchPage = fetcher({ [DOC]: { status: 200 }, [PAGE]: linkingPage });
    expect(await checkCvModelSources(fetchPage, BEFORE_DUE, table(source()))).toEqual([]);
    // The document is only asked whether it answers; the listing page is read.
    expect(fetchPage).toHaveBeenCalledWith(DOC, false);
    expect(fetchPage).toHaveBeenCalledWith(PAGE, true);
  });

  it("reports a reading that is due, with the day it was read and the day it fell due", async () => {
    const fetchPage = fetcher({ [DOC]: { status: 200 }, [PAGE]: linkingPage });
    const findings = await checkCvModelSources(
      fetchPage,
      new Date("2027-07-15T00:00:00Z"),
      table(source()),
    );
    expect(findings).toEqual([
      {
        modelId: "anr",
        document: "Guide 2027",
        url: DOC,
        problem: "due",
        detail: "read on 2026-10-16, due again on 2027-07-15",
      },
    ]);
  });

  it("reports a document that is gone, and one that does not answer", async () => {
    const gone = await checkCvModelSources(
      fetcher({ [DOC]: { status: 404 }, [PAGE]: linkingPage }),
      BEFORE_DUE,
      table(source()),
    );
    expect(gone.map((f) => [f.problem, f.url, f.detail])).toEqual([
      ["unreachable", DOC, "HTTP 404"],
    ]);

    const silent = await checkCvModelSources(
      fetcher({ [DOC]: new Error("timeout"), [PAGE]: linkingPage }),
      BEFORE_DUE,
      table(source()),
    );
    expect(silent.map((f) => f.detail)).toEqual(["no answer (timeout)"]);

    const odd = await checkCvModelSources(
      fetcher({ [DOC]: "boom", [PAGE]: linkingPage }),
      BEFORE_DUE,
      table(source()),
    );
    expect(odd.map((f) => f.detail)).toEqual(["no answer (error)"]);
  });

  it("reports a refused read as unreadable, which never fails the run", async () => {
    for (const status of [401, 403, 429]) {
      const findings = await checkCvModelSources(
        fetcher({ [DOC]: { status }, [PAGE]: { status } }),
        BEFORE_DUE,
        table(source()),
      );
      expect(findings.map((f) => [f.problem, f.url])).toEqual([
        ["unreadable", DOC],
        ["unreadable", PAGE],
      ]);
    }
    expect(FAILING_PROBLEMS.has("unreadable")).toBe(false);
    for (const p of ["due", "unreachable", "unlisted"] as const) {
      expect(FAILING_PROBLEMS.has(p)).toBe(true);
    }
  });

  it("reports a document the funder's page stopped linking to, or a page that is gone", async () => {
    const unlisted = await checkCvModelSources(
      fetcher({ [DOC]: { status: 200 }, [PAGE]: { status: 200, body: "<p>2028 call</p>" } }),
      BEFORE_DUE,
      table(source()),
    );
    expect(unlisted.map((f) => [f.problem, f.url])).toEqual([["unlisted", PAGE]]);

    const empty = await checkCvModelSources(
      fetcher({ [DOC]: { status: 200 }, [PAGE]: { status: 200 } }),
      BEFORE_DUE,
      table(source()),
    );
    expect(empty.map((f) => f.problem)).toEqual(["unlisted"]);

    const pageGone = await checkCvModelSources(
      fetcher({ [DOC]: { status: 200 }, [PAGE]: { status: 410 } }),
      BEFORE_DUE,
      table(source()),
    );
    expect(pageGone.map((f) => [f.problem, f.url, f.detail])).toEqual([
      ["unreachable", PAGE, "HTTP 410"],
    ]);
  });

  it("asks no listing page for a document that has none", async () => {
    const fetchPage = fetcher({ [DOC]: { status: 200 } });
    const findings = await checkCvModelSources(
      fetchPage,
      BEFORE_DUE,
      table(source({ listedOn: undefined })),
    );
    expect(findings).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("checks the committed table by default", async () => {
    const committed = verifiedCvModelSources();
    const answers: Record<string, FetchedPage> = {};
    for (const [, docs] of committed) {
      for (const d of docs) {
        answers[d.url] = { status: 200 };
        if (d.listedOn) {
          const prior = answers[d.listedOn]?.body ?? "";
          answers[d.listedOn] = { status: 200, body: `${prior}<a href="${d.url}">` };
        }
      }
    }
    // The day the earliest committed reading was taken: nothing is due yet.
    const findings = await checkCvModelSources(fetcher(answers), new Date("2026-10-16T12:00:00Z"));
    expect(findings).toEqual([]);
  });
});

describe("formatSourceReport", () => {
  it("says every reading is current when nothing was found", () => {
    expect(formatSourceReport([], 7)).toBe(
      "## CV model sources: 7 document(s) checked\n\nEvery reading is current.\n",
    );
  });

  it("lists each finding in a table and says where to read how to fix it", () => {
    const report = formatSourceReport(
      [
        {
          modelId: "anr",
          document: "Guide 2027",
          url: DOC,
          problem: "unreachable",
          detail: "HTTP 404",
        },
      ],
      2,
    );
    expect(report).toContain("| `anr` | Guide 2027 | unreachable | HTTP 404 | " + DOC + " |");
    expect(report).toContain("docs/CV-MODELS.md");
  });
});
