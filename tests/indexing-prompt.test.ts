import { describe, expect, it, vi } from "vitest";
import {
  INDEXING_PROMPT_KEY_PREFIX,
  indexingBody,
  indexingPromptKey,
  indexingWorklistState,
  isIndexingPromptDismissed,
  postIndexing,
  rememberIndexingPromptDismissal,
  shouldOfferIndexingPrompt,
} from "@/lib/cv/indexingPrompt";
import type { PublishSnapshot, StorageLike } from "@/lib/cv/institutionPrompt";

function snapshot(over: Partial<PublishSnapshot> = {}): PublishSnapshot {
  return {
    published: true,
    slug: "basile-ab12",
    indexable: false,
    listUnderAffiliation: false,
    affiliationRorId: null,
    institutionPage: {
      showOnInstitutionPage: false,
      consentedRorIds: [],
      currentAffiliations: [],
      visibleCurrentRorIds: [],
      lapsedRorIds: [],
      shareReconciliationRows: false,
    },
    ...over,
  };
}

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

describe("indexing prompt — dismissal memory", () => {
  it("is keyed per page (slug) and versioned", () => {
    expect(indexingPromptKey("abc")).toBe(INDEXING_PROMPT_KEY_PREFIX + "abc");
    expect(INDEXING_PROMPT_KEY_PREFIX).toMatch(/-v1:$/);
  });

  it("remembers an answer for one page only; a new page asks again", () => {
    const st = memoryStorage();
    expect(isIndexingPromptDismissed("p1", st)).toBe(false);
    rememberIndexingPromptDismissal("p1", st);
    expect(isIndexingPromptDismissed("p1", st)).toBe(true);
    expect(isIndexingPromptDismissed("p2", st)).toBe(false);
  });

  it("never asks (and never writes) without a slug or a storage", () => {
    const st = memoryStorage();
    rememberIndexingPromptDismissal(null, st);
    expect(st.map.size).toBe(0);
    expect(isIndexingPromptDismissed(null, st)).toBe(false);
    expect(isIndexingPromptDismissed("p1", null)).toBe(false);
  });

  it("treats a throwing storage as not dismissed", () => {
    const bad: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    rememberIndexingPromptDismissal("p1", bad);
    expect(isIndexingPromptDismissed("p1", bad)).toBe(false);
  });
});

describe("shouldOfferIndexingPrompt", () => {
  it("asks only for a live, un-indexable, unanswered page", () => {
    expect(shouldOfferIndexingPrompt(snapshot(), false)).toBe(true);
    expect(shouldOfferIndexingPrompt(snapshot(), true)).toBe(false);
    expect(shouldOfferIndexingPrompt(snapshot({ indexable: true }), false)).toBe(false);
    expect(shouldOfferIndexingPrompt(snapshot({ published: false, slug: null }), false)).toBe(false);
    expect(shouldOfferIndexingPrompt(snapshot({ slug: null }), false)).toBe(false);
  });
});

describe("indexingWorklistState", () => {
  it("names the four states", () => {
    expect(indexingWorklistState(snapshot({ published: false, slug: null }), false)).toBe("unpublished");
    expect(indexingWorklistState(snapshot(), false)).toBe("undecided");
    expect(indexingWorklistState(snapshot(), true)).toBe("off");
    expect(indexingWorklistState(snapshot({ indexable: true }), false)).toBe("on");
    expect(indexingWorklistState(snapshot({ indexable: true }), true)).toBe("on");
  });
});

describe("indexingBody + postIndexing", () => {
  it("carries the FULL publish state with indexing on, institution consents unchanged", () => {
    const body = indexingBody(
      snapshot({
        listUnderAffiliation: true,
        institutionPage: {
          showOnInstitutionPage: true,
          consentedRorIds: ["04chrp450"],
          currentAffiliations: [],
          visibleCurrentRorIds: ["04chrp450"],
          lapsedRorIds: [],
          shareReconciliationRows: true,
        },
      }),
    );
    expect(body).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: true,
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
      shareReconciliationRows: true,
    });
    // A "yes" to indexing is never a "yes" to listing.
    expect(indexingBody(snapshot()).listUnderAffiliation).toBe(false);
    expect(indexingBody(snapshot()).showOnInstitutionPage).toBe(false);
  });

  it("posts once to /api/cv/publish and returns the server's snapshot, or null on failure", async () => {
    const answer = {
      published: true,
      publicSlug: "basile-ab12",
      indexable: true,
      listUnderAffiliation: false,
      affiliationRorId: null,
      showOnInstitutionPage: false,
      consentedRorIds: [],
      currentAffiliations: [],
      visibleCurrentRorIds: [],
      lapsedRorIds: [],
      shareReconciliationRows: false,
    };
    const f = vi.fn(async () => ({ ok: true, json: async () => answer }) as unknown as Response);
    const next = await postIndexing(snapshot(), f as unknown as typeof fetch);
    expect(next).toMatchObject({ published: true, slug: "basile-ab12", indexable: true });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = (f.mock.calls as unknown as unknown[][])[0]!;
    expect(url).toBe("/api/cv/publish");
    expect(JSON.parse((init as { body: string }).body)).toMatchObject({ indexable: true, published: true });

    const bad = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response);
    expect(await postIndexing(snapshot(), bad as unknown as typeof fetch)).toBeNull();
    const thrown = vi.fn(async () => {
      throw new Error("network");
    });
    expect(await postIndexing(snapshot(), thrown as unknown as typeof fetch)).toBeNull();
  });
});
