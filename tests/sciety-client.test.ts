import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchScietyEvaluations } from "@/lib/sciety/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, text: async () => JSON.stringify(body) } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

const DOCMAP = {
  steps: {
    "_:b0": {
      actions: [
        {
          participants: [{ actor: { name: "eLife", type: "organization" } }],
          outputs: [
            {
              type: "evaluation-summary",
              published: "2024-03-01T00:00:00Z",
              content: [{ type: "web-page", url: "https://elifesciences.org/reviews/1" }],
            },
            {
              // Not an evaluation-like type → dropped.
              type: "reply",
              content: [{ url: "https://example.com/reply" }],
            },
          ],
        },
        {
          participants: [{ actor: { name: "PREreview" } }],
          outputs: [
            {
              type: "review-article",
              // No "published" → date omitted.
              content: [],
              url: "https://prereview.org/reviews/2", // fallback to output.url
            },
          ],
        },
      ],
    },
  },
};

describe("fetchScietyEvaluations", () => {
  it("parses the documented single-docmap shape into a bounded list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(DOCMAP)),
    );
    const list = await fetchScietyEvaluations("10.1234/abc");
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({
      group: "eLife",
      type: "evaluation-summary",
      url: "https://elifesciences.org/reviews/1",
      date: "2024-03-01T00:00:00.000Z",
    });
    expect(list[1]).toEqual({
      group: "PREreview",
      type: "review-article",
      url: "https://prereview.org/reviews/2",
      date: undefined,
    });
  });

  it("tolerates an ARRAY of docmaps (one per article version) and dedups", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([DOCMAP, DOCMAP])),
    );
    const list = await fetchScietyEvaluations("10.1234/abc");
    expect(list).toHaveLength(2); // deduped, not 4
  });

  it("returns [] for a malformed DOI without making a call", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchScietyEvaluations("not-a-doi")).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });

  it("returns [] for a 404 (no evaluations recorded)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, false, 404)),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("returns [] when steps is absent / malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ notSteps: {} })),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("skips outputs missing a group or a url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          steps: {
            a: {
              actions: [
                {
                  participants: [], // no actor name
                  outputs: [{ type: "evaluation-summary", content: [{ url: "https://x/1" }] }],
                },
                {
                  participants: [{ actor: { name: "Group" } }],
                  outputs: [{ type: "evaluation-summary", content: [] }], // no url anywhere
                },
              ],
            },
          },
        }),
      ),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("omits the date for an unparsable or empty 'published' value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          steps: {
            a: {
              actions: [
                {
                  participants: [{ actor: { name: "eLife" } }],
                  outputs: [
                    {
                      type: "evaluation-summary",
                      published: "not-a-date",
                      content: [{ url: "https://x/1" }],
                    },
                  ],
                },
                {
                  participants: [{ actor: { name: "eLife" } }],
                  outputs: [
                    {
                      type: "evaluation-summary",
                      published: "",
                      content: [{ url: "https://x/2" }],
                    },
                  ],
                },
              ],
            },
          },
        }),
      ),
    );
    const list = await fetchScietyEvaluations("10.1234/abc");
    expect(list.map((e) => e.date)).toEqual([undefined, undefined]);
  });

  it("skips a non-object entry in content[] and falls back to output.url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          steps: {
            a: {
              actions: [
                {
                  participants: [{ actor: { name: "eLife" } }],
                  outputs: [
                    {
                      type: "evaluation-summary",
                      content: ["not-an-object", { notUrl: true }],
                      url: "https://x/fallback",
                    },
                  ],
                },
              ],
            },
          },
        }),
      ),
    );
    const list = await fetchScietyEvaluations("10.1234/abc");
    expect(list[0]?.url).toBe("https://x/fallback");
  });

  it("skips a non-object action and a non-object step", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          steps: {
            a: "not-an-object", // malformed step
            b: { actions: ["not-an-object"] }, // malformed action
          },
        }),
      ),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("returns [] on unparsable JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: true, status: 200, text: async () => "not json" }) as unknown as Response,
      ),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });

  it("caps the list at 10 evaluations", async () => {
    const manyActions = Array.from({ length: 15 }, (_, i) => ({
      participants: [{ actor: { name: `Group${i}` } }],
      outputs: [{ type: "evaluation-summary", content: [{ url: `https://x/${i}` }] }],
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ steps: { a: { actions: manyActions } } })),
    );
    const list = await fetchScietyEvaluations("10.1234/abc");
    expect(list).toHaveLength(10);
  });

  it("returns [] when the body exceeds the byte cap", async () => {
    const huge = "x".repeat(3_000_000);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => huge }) as unknown as Response),
    );
    expect(await fetchScietyEvaluations("10.1234/abc")).toEqual([]);
  });
});
