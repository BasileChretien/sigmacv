import { beforeEach, describe, expect, it, vi } from "vitest";

// ownerCorrections imports prisma at module load; give it a valid-looking env
// and mock the client, per the convention in tests/coauthor-links.test.ts.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const mocks = vi.hoisted(() => ({ userFindUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.userFindUnique } } }));
import {
  applyOwnerCorrections,
  hasCorrections,
  type OwnerCorrections,
} from "@/lib/cv/ownerCorrections";
import { fetchOwnerCorrections } from "@/lib/cv/fetchOwnerCorrections";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

function item(over: Partial<CvItem> = {}): CvItem {
  return {
    id: over.id ?? "W1",
    source: "openalex",
    sourceId: "s",
    csl: { id: over.id ?? "W1", type: "article-journal", title: "A work" },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...over,
  } as CvItem;
}

function cv(items: CvItem[]): CanonicalCv {
  return {
    schemaVersion: 2,
    owner: { name: "A Researcher" },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
    ],
    display: {},
  } as unknown as CanonicalCv;
}

function corrections(
  over: Partial<Record<keyof OwnerCorrections, string[]>> = {},
): OwnerCorrections {
  return {
    notMineIds: new Set(over.notMineIds ?? []),
    notMineDois: new Set(over.notMineDois ?? []),
    confirmedIds: new Set(over.confirmedIds ?? []),
    confirmedDois: new Set(over.confirmedDois ?? []),
  };
}

const flagged = {
  reviewFlag: "likely-misattributed",
  misattribution: { score: 0.8, signals: [] },
} as const satisfies CvItem["meta"];

describe("applyOwnerCorrections", () => {
  it("removes a work the researcher said is not theirs", () => {
    // The point: a fresh preview is raw machine output, and OpenAlex over-merges
    // same-named people. The person whose work it is has already answered.
    const out = applyOwnerCorrections(
      cv([item({ id: "W1" }), item({ id: "W2" })]),
      corrections({ notMineIds: ["W1"] }),
    );
    expect(out.sections[0]!.items.map((i) => i.id)).toEqual(["W2"]);
  });

  it("matches by DOI too, since item ids can differ between builds", () => {
    const out = applyOwnerCorrections(
      cv([item({ id: "fresh-id", meta: { doi: "10.1234/ABC" } })]),
      corrections({ notMineDois: ["10.1234/abc"] }),
    );
    expect(out.sections[0]!.items).toHaveLength(0);
  });

  it("normalises a doi.org URL before comparing", () => {
    const out = applyOwnerCorrections(
      cv([item({ meta: { doi: "https://doi.org/10.1234/AbC" } })]),
      corrections({ notMineDois: ["10.1234/abc"] }),
    );
    expect(out.sections[0]!.items).toHaveLength(0);
  });

  it("clears the doubt flag on a work the researcher examined and kept", () => {
    // They have answered the question the flag asks; keep the work, drop the doubt.
    const out = applyOwnerCorrections(
      cv([item({ id: "W1", meta: flagged })]),
      corrections({ confirmedIds: ["W1"] }),
    );
    const it0 = out.sections[0]!.items[0]!;
    expect(it0.meta.reviewFlag).toBeUndefined();
    expect(it0.meta.misattribution).toBeUndefined();
  });

  it("leaves the flag alone on a work they have NOT ruled on", () => {
    const out = applyOwnerCorrections(cv([item({ id: "W1", meta: flagged })]), corrections());
    expect(out.sections[0]!.items[0]!.meta.reviewFlag).toBe("likely-misattributed");
  });

  it("never adds an item, a field, or a flag", () => {
    // The privacy line: every correction either removes a work or removes a
    // warning. Nothing here can increase what an anonymous viewer sees.
    const before = cv([item({ id: "W1" }), item({ id: "W2", meta: flagged })]);
    const after = applyOwnerCorrections(
      before,
      corrections({ notMineIds: ["W1"], confirmedIds: ["W2"] }),
    );
    expect(after.sections[0]!.items.length).toBeLessThan(before.sections[0]!.items.length);
    const kept = after.sections[0]!.items[0]!;
    const original = before.sections[0]!.items[1]!;
    for (const key of Object.keys(kept.meta)) {
      // Every surviving meta key existed before; none was introduced.
      expect(Object.keys(original.meta)).toContain(key);
    }
  });

  it("is a no-op when there is nothing to apply", () => {
    const input = cv([item()]);
    expect(applyOwnerCorrections(input, corrections())).toBe(input);
    expect(hasCorrections(corrections())).toBe(false);
  });

  it("does not mutate the input", () => {
    const input = cv([item({ id: "W1", meta: flagged })]);
    const snapshot = JSON.stringify(input);
    applyOwnerCorrections(input, corrections({ notMineIds: ["W1"] }));
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("ignores display choices entirely — only corrections are honoured", () => {
    // `included: false` is a CV-length decision, not a statement that the work
    // is not theirs. Applying it would misrepresent the record and leak an
    // editorial choice, so nothing in the corrections can express it.
    const hidden = item({ id: "W1", included: false });
    const out = applyOwnerCorrections(cv([hidden]), corrections());
    expect(out.sections[0]!.items).toHaveLength(1);
    expect(out.sections[0]!.items[0]!.included).toBe(false);
  });
});

describe("fetchOwnerCorrections", () => {
  beforeEach(() => mocks.userFindUnique.mockReset());

  /** A REAL canonical document (safeParseCanonicalCv must accept it), with the
   *  first `patch.length` citation items overwritten by the given partials. */
  function stored(patches: Array<Partial<CvItem>>) {
    const built = buildCanonicalCv({
      id: "o",
      resolved: {
        orcid: "0000-0002-7483-2489",
        authorIds: ["A5001069481"],
        displayName: "A Researcher",
      },
      works: worksFixture as unknown as OpenAlexWork[],
      now: "2026-09-03T00:00:00.000Z",
    });
    let next = 0;
    const document = {
      ...built,
      sections: built.sections.map((sec) => ({
        ...sec,
        items: sec.items.map((it) => {
          if (!it.csl || next >= patches.length) return it;
          const patch = patches[next++]!;
          return { ...it, ...patch, meta: { ...it.meta, ...(patch.meta ?? {}) } };
        }),
      })),
    };
    return { cv: { document } };
  }

  it("reads notMine and reviewedAt, and nothing else", async () => {
    mocks.userFindUnique.mockResolvedValue(
      stored([
        { notMine: true, meta: { doi: "10.1/a" } },
        { reviewedAt: "2026-09-03T00:00:00.000Z", meta: { doi: "10.1/B" } },
        { included: false }, // a display choice — must be ignored
      ]),
    );
    const c = await fetchOwnerCorrections("0000-0002-7483-2489");
    expect(c.notMineIds.size).toBe(1);
    expect([...c.notMineDois]).toEqual(["10.1/a"]);
    expect(c.confirmedIds.size).toBe(1);
    expect([...c.confirmedDois]).toEqual(["10.1/b"]); // lowercased
    // The hidden work contributed to neither set — display choices are not read.
    expect(c.notMineIds.size + c.confirmedIds.size).toBe(2);
  });

  it("treats a rejected work as rejected even if it was also reviewed", async () => {
    mocks.userFindUnique.mockResolvedValue(
      stored([{ notMine: true, reviewedAt: "2026-09-03T00:00:00.000Z" }]),
    );
    const c = await fetchOwnerCorrections("0000-0002-7483-2489");
    expect(c.notMineIds.size).toBe(1);
    expect(c.confirmedIds.size).toBe(0);
  });

  it("returns nothing when the ORCID has no account", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    expect(hasCorrections(await fetchOwnerCorrections("0000-0002-7483-2489"))).toBe(false);
  });

  it("returns nothing when the stored document is unparseable", async () => {
    mocks.userFindUnique.mockResolvedValue({ cv: { document: { nope: true } } });
    expect(hasCorrections(await fetchOwnerCorrections("0000-0002-7483-2489"))).toBe(false);
  });

  it("is fail-soft: a database fault never breaks the preview", async () => {
    // Exercised via a throwing property access rather than a throwing mock
    // IMPLEMENTATION: vitest reports the latter as a test failure even when the
    // caller catches it, which would hide the very behaviour under test.
    mocks.userFindUnique.mockResolvedValue({
      get cv(): never {
        throw new Error("db fault");
      },
    });
    let threw = false;
    let result;
    try {
      result = await fetchOwnerCorrections("0000-0002-7483-2489");
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(hasCorrections(result!)).toBe(false);
  });

  it("rejects a malformed iD without querying at all", async () => {
    expect(hasCorrections(await fetchOwnerCorrections(""))).toBe(false);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });
});
