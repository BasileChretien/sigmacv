import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPubmedSummaries,
  GUIDELINE_PUBLICATION_TYPES,
  isGuideline,
  PUBMED_BATCH_SIZE,
} from "@/lib/pubmed/client";

/**
 * The PubMed esummary client: parses the record fields the guideline pass needs
 * (title, journal abbreviation, year, publication types), names itself politely,
 * batches, and answers `null` — not an empty map — when a call fails.
 */

const res = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => vi.unstubAllGlobals());

describe("fetchPubmedSummaries", () => {
  it("parses title, source, year and publication types; skips a record with no title", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      res({
        result: {
          uids: ["34724392", "9", "77"],
          "34724392": {
            uid: "34724392",
            title: "Management of Immune-Related Adverse Events: ASCO Guideline Update.",
            source: "J Clin Oncol",
            pubdate: "2021 Dec 20",
            pubtype: ["Journal Article", "Practice Guideline"],
          },
          "9": { uid: "9", title: "", pubtype: ["Review"] },
          "77": { uid: "77", title: "No date, no source", pubtype: "not-an-array" },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const map = await fetchPubmedSummaries(["34724392", "9", "77", "77", "abc"], "ci@example.org");
    expect(map).not.toBeNull();
    expect(map!.get("34724392")).toEqual({
      pmid: "34724392",
      title: "Management of Immune-Related Adverse Events: ASCO Guideline Update.",
      source: "J Clin Oncol",
      year: 2021,
      publicationTypes: ["Journal Article", "Practice Guideline"],
    });
    expect(map!.has("9")).toBe(false);
    expect(map!.get("77")).toEqual({
      pmid: "77",
      title: "No date, no source",
      publicationTypes: [],
    });
    // Polite and bounded: names the tool and the contact, json, the ids de-duplicated.
    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.origin + url.pathname).toBe(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
    );
    expect(url.searchParams.get("db")).toBe("pubmed");
    expect(url.searchParams.get("retmode")).toBe("json");
    expect(url.searchParams.get("tool")).toBe("SigmaCV");
    expect(url.searchParams.get("email")).toBe("ci@example.org");
    expect(url.searchParams.get("id")).toBe("34724392,9,77");
  });

  it("batches long id lists, spacing the calls, and makes no call for no ids", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const ids = new URL(String(input)).searchParams.get("id")!.split(",");
      const result: Record<string, unknown> = { uids: ids };
      for (const id of ids) result[id] = { uid: id, title: `T${id}`, pubtype: [] };
      return res({ result });
    });
    vi.stubGlobal("fetch", fetchMock);
    const ids = Array.from({ length: PUBMED_BATCH_SIZE + 5 }, (_, i) => String(1000 + i));
    const map = await fetchPubmedSummaries(ids, "ci@example.org", { minIntervalMs: 0 });
    expect(map!.size).toBe(PUBMED_BATCH_SIZE + 5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await fetchPubmedSummaries([], "ci@example.org")).toEqual(new Map());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("answers null — never an empty map — when a call fails or the body is not what PubMed sends", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ error: "down" }, 503)),
    );
    expect(await fetchPubmedSummaries(["1"], "ci@example.org")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    expect(await fetchPubmedSummaries(["1"], "ci@example.org")).toBeNull();
    // A well-formed answer with an unexpected shape is an empty answer, not a failure.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ something: "else" })),
    );
    expect(await fetchPubmedSummaries(["1"], "ci@example.org")).toEqual(new Map());
  });
});

describe("isGuideline", () => {
  it("is true for a practice guideline or consensus statement, false for a review or a trial", () => {
    for (const t of GUIDELINE_PUBLICATION_TYPES) {
      expect(isGuideline({ publicationTypes: ["Journal Article", t] }), t).toBe(true);
    }
    expect(isGuideline({ publicationTypes: ["Journal Article", "Review"] })).toBe(false);
    expect(isGuideline({ publicationTypes: ["Randomized Controlled Trial"] })).toBe(false);
    expect(isGuideline({ publicationTypes: [] })).toBe(false);
  });
});
