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
const PAGE = "https://funder.example/calls/2027/";
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
const run = (answers: Record<string, FetchedPage | Error | string>, doc = source()) =>
  checkCvModelSources(fetcher(answers), BEFORE_DUE, table(doc));

describe("pageLinksTo", () => {
  it("finds a link however the page writes it", () => {
    const forms = [
      `<a href="${DOC}">`, // absolute
      `<a href="/files/2027/guide.pdf">`, // root-relative
      `<a href="../../files/2027/guide.pdf">`, // relative to the page
      `<a href='/files/2027/guide.pdf'>`, // single quotes
      `<a href=/files/2027/guide.pdf>`, // unquoted
      `<a HREF = "http://funder.example/files/2027/guide.pdf#p2">`, // other scheme, fragment
    ];
    for (const html of forms) expect(pageLinksTo(html, DOC, PAGE), html).toBe(true);
  });

  it("compares addresses whatever their escaping, and decodes &amp; in a query", () => {
    const spaced = "https://funder.example/files/Guide%20for%20applicants%202027.pdf";
    expect(pageLinksTo(`<a href="/files/Guide for applicants 2027.pdf">`, spaced, PAGE)).toBe(true);
    const query = "https://funder.example/get?id=7&lang=fr";
    expect(pageLinksTo(`<a href="/get?id=7&amp;lang=fr">`, query, PAGE)).toBe(true);
    // A malformed escape is compared as written rather than thrown on.
    const odd = "https://funder.example/files/100%.pdf";
    expect(pageLinksTo(`<a href="/files/100%.pdf">`, odd, PAGE)).toBe(true);
  });

  it("does not find a document the page no longer links to, and skips hrefs that are not addresses", () => {
    expect(pageLinksTo(`<a href="/files/2028/guide.pdf">`, DOC, PAGE)).toBe(false);
    expect(pageLinksTo(`<a href="https://other.example/files/2027/guide.pdf">`, DOC, PAGE)).toBe(
      false,
    );
    expect(pageLinksTo(`<a href="http://[broken">`, DOC, PAGE)).toBe(false);
    expect(pageLinksTo(`<p>no links</p>`, DOC, PAGE)).toBe(false);
  });
});

describe("checkCvModelSources", () => {
  it("reports nothing when the reading is current, the document answers and is still listed", async () => {
    const fetchPage = fetcher({ [DOC]: { status: 200, url: DOC }, [PAGE]: linkingPage });
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

  it("reports a document that says it is gone", async () => {
    for (const status of [404, 410]) {
      const findings = await run({ [DOC]: { status }, [PAGE]: linkingPage });
      expect(findings.map((f) => [f.problem, f.url, f.detail])).toEqual([
        ["unreachable", DOC, `HTTP ${status}`],
      ]);
    }
  });

  it("reports a document that now redirects to another address, not one that only changed scheme", async () => {
    const home = "https://funder.example/";
    const moved = await run({ [DOC]: { status: 200, url: home }, [PAGE]: linkingPage });
    expect(moved.map((f) => [f.problem, f.detail])).toEqual([
      ["unreachable", `now redirects to ${home}`],
    ]);
    const https = await run({
      [DOC]: { status: 200, url: DOC.replace("https:", "http:") },
      [PAGE]: linkingPage,
    });
    expect(https).toEqual([]);
  });

  it("reports a refused, failed or silent read as unreadable, which never fails the run", async () => {
    const cases: Array<[FetchedPage | Error | string, string]> = [
      [{ status: 403 }, "HTTP 403: the site refused an automated read"],
      [{ status: 429 }, "HTTP 429: the site refused an automated read"],
      [{ status: 503 }, "HTTP 503: the site failed to answer"],
      [new Error("timeout"), "no answer (timeout)"],
      ["boom", "no answer (error)"],
    ];
    for (const [answer, detail] of cases) {
      const findings = await run({ [DOC]: answer, [PAGE]: answer });
      expect(findings.map((f) => [f.problem, f.url, f.detail])).toEqual([
        ["unreadable", DOC, detail],
        ["unreadable", PAGE, detail],
      ]);
    }
    expect(FAILING_PROBLEMS.has("unreadable")).toBe(false);
    for (const p of ["due", "unreachable", "unlisted"] as const) {
      expect(FAILING_PROBLEMS.has(p)).toBe(true);
    }
  });

  it("reports a document the funder's page stopped linking to, or a page that is gone", async () => {
    const unlisted = await run({
      [DOC]: { status: 200 },
      [PAGE]: { status: 200, body: `<a href="/files/2028/guide.pdf">` },
    });
    expect(unlisted.map((f) => [f.problem, f.url])).toEqual([["unlisted", PAGE]]);

    const empty = await run({ [DOC]: { status: 200 }, [PAGE]: { status: 200 } });
    expect(empty.map((f) => f.problem)).toEqual(["unlisted"]);

    const pageGone = await run({ [DOC]: { status: 200 }, [PAGE]: { status: 410 } });
    expect(pageGone.map((f) => [f.problem, f.url, f.detail])).toEqual([
      ["unreachable", PAGE, "HTTP 410"],
    ]);
  });

  it("resolves the listing page's relative links against the address it was served from", async () => {
    const served = "https://funder.example/calls/2027/details/";
    const findings = await run({
      [DOC]: { status: 200 },
      [PAGE]: { status: 200, url: served, body: `<a href="../../../files/2027/guide.pdf">` },
    });
    expect(findings).toEqual([]);
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

  it("lists each finding in a table and says where to read what to do", () => {
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
