import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NO_INSTITUTION_PAGE } from "@/lib/cv/institutionConsent";
import {
  INSTITUTION_PROMPT_KEY_PREFIX,
  affiliationSetKey,
  browserStorage,
  canListNow,
  institutionListingBody,
  isPromptDismissed,
  listedAffiliations,
  postInstitutionListing,
  promptDismissalKey,
  publishSnapshotFromResponse,
  rememberPromptDismissal,
  shouldOfferInstitutionPrompt,
  unlistedAffiliations,
  type PublishSnapshot,
  type StorageLike,
} from "@/lib/cv/institutionPrompt";

/**
 * The active-choice institution prompt: DISCOVERABILITY, never a default.
 * Nothing is decided by silence — the pure helpers here decide only WHEN to
 * ask (published + indexable + an unlisted current affiliation + not yet
 * answered for this set of ROR ids) and WHAT one "yes" posts (the FULL current
 * publish state plus the three listing fields — the route treats every omitted
 * flag as false). A dismissal is remembered per ROR-id set, so a new
 * affiliation re-asks, as the consent design promises.
 */

const NAGOYA = { rorId: "04chrp450", name: "Nagoya University" };
const CAEN = { rorId: "04d9jrx35", name: "CHU de Caen Normandie" };

function snapshot(over: Partial<PublishSnapshot> = {}): PublishSnapshot {
  return {
    published: true,
    slug: "ada-x7",
    indexable: true,
    listUnderAffiliation: false,
    affiliationRorId: NAGOYA.rorId,
    institutionPage: {
      ...NO_INSTITUTION_PAGE,
      currentAffiliations: [NAGOYA],
      visibleCurrentRorIds: [NAGOYA.rorId],
    },
    ...over,
  };
}

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
  };
}

describe("affiliation set keys", () => {
  it("are order-independent, deduplicated and versioned", () => {
    expect(affiliationSetKey(["b", "a", "b"])).toBe("a+b");
    expect(affiliationSetKey([])).toBe("");
    expect(promptDismissalKey(["b", "a"])).toBe(`${INSTITUTION_PROMPT_KEY_PREFIX}a+b`);
    expect(INSTITUTION_PROMPT_KEY_PREFIX).toMatch(/-v1:$/);
  });
});

describe("dismissal memory", () => {
  it("remembers a dismissal per ROR-id set, so a new affiliation re-asks", () => {
    const storage = memoryStorage();
    expect(isPromptDismissed([NAGOYA.rorId], storage)).toBe(false);
    rememberPromptDismissal([NAGOYA.rorId], storage);
    expect(isPromptDismissed([NAGOYA.rorId], storage)).toBe(true);
    // A second affiliation is a different set: ask again.
    expect(isPromptDismissed([NAGOYA.rorId, CAEN.rorId], storage)).toBe(false);
    // Back to the old set alone: still answered.
    expect(isPromptDismissed([NAGOYA.rorId], storage)).toBe(true);
  });

  it("never records or reads an empty set, and survives a storage that throws or is absent", () => {
    const storage = memoryStorage();
    rememberPromptDismissal([], storage);
    expect(storage.data.size).toBe(0);
    expect(isPromptDismissed([], storage)).toBe(false);
    expect(isPromptDismissed([NAGOYA.rorId], null)).toBe(false);
    expect(() => rememberPromptDismissal([NAGOYA.rorId], null)).not.toThrow();
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(isPromptDismissed([NAGOYA.rorId], throwing)).toBe(false);
    expect(() => rememberPromptDismissal([NAGOYA.rorId], throwing)).not.toThrow();
  });
});

describe("browserStorage", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it("returns null when there is no localStorage (server render) or reading it throws", () => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(browserStorage()).toBeNull();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });
    expect(browserStorage()).toBeNull();
  });

  it("returns the store when it exists", () => {
    const store = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: store });
    expect(browserStorage()).toBe(store);
  });
});

describe("listed / unlisted affiliations", () => {
  it("an affiliation is listed only with BOTH consents on and its id consented", () => {
    expect(unlistedAffiliations(snapshot())).toEqual([NAGOYA]);
    expect(listedAffiliations(snapshot())).toEqual([]);
    // Institution page on, OAI listing off: still not listed.
    const pageOnly = snapshot({
      institutionPage: {
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
        showOnInstitutionPage: true,
        consentedRorIds: [NAGOYA.rorId],
      },
    });
    expect(unlistedAffiliations(pageOnly)).toEqual([NAGOYA]);
    // Both on: listed.
    const both = { ...pageOnly, listUnderAffiliation: true };
    expect(listedAffiliations(both)).toEqual([NAGOYA]);
    expect(unlistedAffiliations(both)).toEqual([]);
    // Two affiliations, one consented: the other is unlisted.
    const two = {
      ...both,
      institutionPage: {
        ...both.institutionPage,
        currentAffiliations: [NAGOYA, CAEN],
        visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
      },
    };
    expect(listedAffiliations(two)).toEqual([NAGOYA]);
    expect(unlistedAffiliations(two)).toEqual([CAEN]);
  });

  it("with no ROR-linked current position there is nothing to list", () => {
    const none = snapshot({ institutionPage: NO_INSTITUTION_PAGE, affiliationRorId: null });
    expect(unlistedAffiliations(none)).toEqual([]);
    expect(listedAffiliations(none)).toEqual([]);
  });
});

describe("shouldOfferInstitutionPrompt — the visibility matrix", () => {
  it("asks only when published, indexable, an unlisted ROR-linked affiliation exists, and not dismissed", () => {
    expect(canListNow(snapshot())).toBe(true);
    expect(shouldOfferInstitutionPrompt(snapshot(), false)).toBe(true);
    expect(shouldOfferInstitutionPrompt(snapshot(), true)).toBe(false);
    expect(shouldOfferInstitutionPrompt(snapshot({ published: false }), false)).toBe(false);
    expect(shouldOfferInstitutionPrompt(snapshot({ indexable: false }), false)).toBe(false);
    expect(canListNow(snapshot({ indexable: false }))).toBe(false);
    expect(
      shouldOfferInstitutionPrompt(
        snapshot({ institutionPage: NO_INSTITUTION_PAGE, affiliationRorId: null }),
        false,
      ),
    ).toBe(false);
    const listed = snapshot({
      listUnderAffiliation: true,
      institutionPage: {
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
        showOnInstitutionPage: true,
        consentedRorIds: [NAGOYA.rorId],
      },
    });
    expect(shouldOfferInstitutionPrompt(listed, false)).toBe(false);
  });
});

describe("institutionListingBody — one POST, the full state", () => {
  it("carries the current publish state plus the three listing fields, and only the given ids", () => {
    expect(institutionListingBody(snapshot(), [NAGOYA.rorId])).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: true,
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
      shareReconciliationRows: false,
    });
  });

  it("keeps ids already stored (a lapsed id is kept, never dropped by a new tick) and deduplicates", () => {
    const stored = snapshot({
      institutionPage: {
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA, CAEN],
        visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
        showOnInstitutionPage: true,
        consentedRorIds: ["00old0000", NAGOYA.rorId],
        lapsedRorIds: ["00old0000"],
        shareReconciliationRows: true,
      },
    });
    expect(institutionListingBody(stored, [NAGOYA.rorId, CAEN.rorId]).consentedRorIds).toEqual([
      "00old0000",
      NAGOYA.rorId,
      CAEN.rorId,
    ]);
    expect(institutionListingBody(stored, [CAEN.rorId]).shareReconciliationRows).toBe(true);
  });
});

describe("publishSnapshotFromResponse", () => {
  const answer = {
    published: true,
    publicSlug: "ada-x7",
    indexable: true,
    listUnderAffiliation: true,
    affiliationRorId: NAGOYA.rorId,
    showOnInstitutionPage: true,
    consentedRorIds: [NAGOYA.rorId],
    currentAffiliations: [NAGOYA],
    visibleCurrentRorIds: [NAGOYA.rorId],
    lapsedRorIds: [],
    shareReconciliationRows: false,
  };

  it("maps the API answer to the snapshot the host tracks", () => {
    expect(publishSnapshotFromResponse(answer)).toEqual({
      published: true,
      slug: "ada-x7",
      indexable: true,
      listUnderAffiliation: true,
      affiliationRorId: NAGOYA.rorId,
      institutionPage: {
        showOnInstitutionPage: true,
        consentedRorIds: [NAGOYA.rorId],
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
        lapsedRorIds: [],
        shareReconciliationRows: false,
      },
    });
  });

  it("rejects anything that is not the full shape", () => {
    expect(publishSnapshotFromResponse(null)).toBeNull();
    expect(publishSnapshotFromResponse("no")).toBeNull();
    expect(publishSnapshotFromResponse({ ...answer, published: "yes" })).toBeNull();
    expect(publishSnapshotFromResponse({ ...answer, publicSlug: 3 })).toBeNull();
    expect(publishSnapshotFromResponse({ ...answer, affiliationRorId: 3 })).toBeNull();
    expect(publishSnapshotFromResponse({ ...answer, consentedRorIds: "x" })).toBeNull();
    expect(publishSnapshotFromResponse({ ...answer, shareReconciliationRows: 1 })).toBeNull();
    // null slug / null ROR key are legitimate.
    expect(
      publishSnapshotFromResponse({ ...answer, publicSlug: null, affiliationRorId: null }),
    ).not.toBeNull();
  });
});

describe("postInstitutionListing", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs the full body to /api/cv/publish and returns the server's answer", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        published: true,
        publicSlug: "ada-x7",
        indexable: true,
        listUnderAffiliation: true,
        affiliationRorId: NAGOYA.rorId,
        ...NO_INSTITUTION_PAGE,
        showOnInstitutionPage: true,
        consentedRorIds: [NAGOYA.rorId],
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
      }),
    });
    const next = await postInstitutionListing(snapshot(), [NAGOYA.rorId]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/cv/publish");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(
      institutionListingBody(snapshot(), [NAGOYA.rorId]),
    );
    expect(next?.listUnderAffiliation).toBe(true);
    expect(next?.institutionPage.consentedRorIds).toEqual([NAGOYA.rorId]);
  });

  it("returns null on a failed request, a malformed answer, or a network error", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "nope" }) });
    expect(await postInstitutionListing(snapshot(), [NAGOYA.rorId])).toBeNull();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ published: true }) });
    expect(await postInstitutionListing(snapshot(), [NAGOYA.rorId])).toBeNull();
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await postInstitutionListing(snapshot(), [NAGOYA.rorId])).toBeNull();
  });
});
